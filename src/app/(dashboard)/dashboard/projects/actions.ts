'use server'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { projectFormSchema } from '@/lib/validation/project'
import { uploadProjectCover, deleteStoredFile } from '@/lib/storage'
import { resolveUniqueProjectSlug } from '@/lib/slug'
import { revalidatePath } from 'next/cache'

export interface ProjectActionState {
  success: boolean
  message?: string
  fieldErrors?: Record<string, string[]>
  projectId?: string
}

function parseJsonArray(value: FormDataEntryValue | null): string[] {
  if (!value || typeof value !== 'string') return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map((item) => String(item).trim()).filter(Boolean) : []
  } catch {
    return []
  }
}

/**
 * 1. Tambah Project Baru (DATA-01)
 */
export async function createProjectAction(
  _prevState: ProjectActionState | null,
  formData: FormData
): Promise<ProjectActionState> {
  const admin = await requireAdmin()

  const profile = await db.profile.findUnique({
    where: { administratorId: admin.id },
    select: { id: true },
  })

  if (!profile) {
    return {
      success: false,
      message: 'Profil administrator belum dibuat. Harap isi profil terlebih dahulu.',
    }
  }

  // Parse arrays & booleans
  const technologies = parseJsonArray(formData.get('technologies'))
  const responsibilities = parseJsonArray(formData.get('responsibilities'))
  const outcomes = parseJsonArray(formData.get('outcomes'))
  const skillIds = parseJsonArray(formData.get('skillIds'))

  const isOngoing = formData.get('isOngoing') === 'true' || formData.get('isOngoing') === 'on'
  const published = formData.get('published') === 'true' || formData.get('published') === 'on'
  let featured = formData.get('featured') === 'true' || formData.get('featured') === 'on'

  // Unfeature saat unpublish (Requirement 4)
  if (!published) {
    featured = false
  }

  // Validasi form data dengan Zod
  const validation = projectFormSchema.safeParse({
    title: formData.get('title'),
    shortSummary: formData.get('shortSummary'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    role: formData.get('role'),
    projectType: formData.get('projectType'),
    startDate: formData.get('startDate'),
    endDate: isOngoing ? null : formData.get('endDate'),
    isOngoing,
    technologies,
    responsibilities,
    outcomes,
    repositoryUrl: formData.get('repositoryUrl'),
    demoUrl: formData.get('demoUrl'),
    featured,
    published,
    skillIds,
  })

  if (!validation.success) {
    return {
      success: false,
      message: 'Terdapat kesalahan pada isian form. Harap periksa kembali.',
      fieldErrors: validation.error.flatten().fieldErrors,
    }
  }

  const valid = validation.data

  // Upload cover image jika ada
  let coverImageUrl: string | null = null
  const coverFile = formData.get('coverImage') as File | null
  if (coverFile && coverFile.size > 0 && coverFile.name !== 'undefined') {
    try {
      coverImageUrl = await uploadProjectCover(coverFile)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Gagal mengunggah gambar cover'
      return {
        success: false,
        message: errMsg,
        fieldErrors: { coverImage: [errMsg] },
      }
    }
  }

  // Hitung sortOrder berikutnya
  const maxOrder = await db.project.aggregate({
    where: { profileId: profile.id },
    _max: { sortOrder: true },
  })
  const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1

  // Slug otomatis unik
  const slugToUse = await resolveUniqueProjectSlug(
    profile.id,
    valid.slug && valid.slug.trim() ? valid.slug : valid.title
  )

  try {
    const newProject = await db.project.create({
      data: {
        profileId: profile.id,
        slug: slugToUse,
        title: valid.title,
        shortSummary: valid.shortSummary,
        description: valid.description,
        role: valid.role,
        projectType: valid.projectType,
        startDate: valid.startDate ? new Date(valid.startDate) : null,
        endDate: valid.isOngoing || !valid.endDate ? null : new Date(valid.endDate),
        isOngoing: valid.isOngoing,
        technologies: valid.technologies,
        responsibilities: valid.responsibilities,
        outcomes: valid.outcomes,
        repositoryUrl: valid.repositoryUrl,
        demoUrl: valid.demoUrl,
        coverImageUrl,
        featured: valid.featured,
        published: valid.published,
        sortOrder: nextOrder,
        skills: {
          create: valid.skillIds.map((skillId) => ({
            skill: { connect: { id: skillId } },
          })),
        },
      },
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/projects')
    return {
      success: true,
      message: 'Proyek berhasil ditambahkan',
      projectId: newProject.id,
    }
  } catch (error) {
    console.error('Error creating project:', error)
    return {
      success: false,
      message: 'Terjadi kesalahan saat menyimpan proyek ke database.',
    }
  }
}

/**
 * 2. Update Project (DATA-01, DATA-04)
 */
export async function updateProjectAction(
  id: string,
  _prevState: ProjectActionState | null,
  formData: FormData
): Promise<ProjectActionState> {
  const admin = await requireAdmin()

  const existingProject = await db.project.findFirst({
    where: {
      id,
      profile: { administratorId: admin.id },
    },
  })

  if (!existingProject) {
    return {
      success: false,
      message: 'Proyek tidak ditemukan atau Anda tidak memiliki izin untuk mengeditnya.',
    }
  }

  // Parse arrays & booleans
  const technologies = parseJsonArray(formData.get('technologies'))
  const responsibilities = parseJsonArray(formData.get('responsibilities'))
  const outcomes = parseJsonArray(formData.get('outcomes'))
  const skillIds = parseJsonArray(formData.get('skillIds'))

  const isOngoing = formData.get('isOngoing') === 'true' || formData.get('isOngoing') === 'on'
  const published = formData.get('published') === 'true' || formData.get('published') === 'on'
  let featured = formData.get('featured') === 'true' || formData.get('featured') === 'on'

  // Unfeature saat unpublish (Requirement 4)
  if (!published) {
    featured = false
  }

  // Validasi Zod
  const validation = projectFormSchema.safeParse({
    title: formData.get('title'),
    shortSummary: formData.get('shortSummary'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    role: formData.get('role'),
    projectType: formData.get('projectType'),
    startDate: formData.get('startDate'),
    endDate: isOngoing ? null : formData.get('endDate'),
    isOngoing,
    technologies,
    responsibilities,
    outcomes,
    repositoryUrl: formData.get('repositoryUrl'),
    demoUrl: formData.get('demoUrl'),
    featured,
    published,
    skillIds,
  })

  if (!validation.success) {
    return {
      success: false,
      message: 'Terdapat kesalahan pada isian form. Harap periksa kembali.',
      fieldErrors: validation.error.flatten().fieldErrors,
    }
  }

  const valid = validation.data

  // Slug stability (Requirement 3):
  // Jika slug diubah secara manual dan berbeda dengan slug yang ada, pastikan unik.
  // Jika tidak diubah, tetap pertahankan slug yang sudah ada.
  let targetSlug = existingProject.slug
  if (valid.slug && valid.slug.trim() !== '' && valid.slug !== existingProject.slug) {
    targetSlug = await resolveUniqueProjectSlug(existingProject.profileId, valid.slug, id)
  }

  // Handle Cover Image
  let updatedCoverImageUrl = existingProject.coverImageUrl
  const removeCover = formData.get('removeCover') === 'true'
  const coverFile = formData.get('coverImage') as File | null

  if (removeCover && updatedCoverImageUrl) {
    await deleteStoredFile(updatedCoverImageUrl)
    updatedCoverImageUrl = null
  }

  if (coverFile && coverFile.size > 0 && coverFile.name !== 'undefined') {
    try {
      const newUrl = await uploadProjectCover(coverFile)
      if (existingProject.coverImageUrl) {
        await deleteStoredFile(existingProject.coverImageUrl)
      }
      updatedCoverImageUrl = newUrl
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Gagal mengunggah gambar cover'
      return {
        success: false,
        message: errMsg,
        fieldErrors: { coverImage: [errMsg] },
      }
    }
  }

  try {
    await db.$transaction(async (tx) => {
      // 1. Update Project
      await tx.project.update({
        where: { id },
        data: {
          slug: targetSlug,
          title: valid.title,
          shortSummary: valid.shortSummary,
          description: valid.description,
          role: valid.role,
          projectType: valid.projectType,
          startDate: valid.startDate ? new Date(valid.startDate) : null,
          endDate: valid.isOngoing || !valid.endDate ? null : new Date(valid.endDate),
          isOngoing: valid.isOngoing,
          technologies: valid.technologies,
          responsibilities: valid.responsibilities,
          outcomes: valid.outcomes,
          repositoryUrl: valid.repositoryUrl,
          demoUrl: valid.demoUrl,
          coverImageUrl: updatedCoverImageUrl,
          featured: valid.featured,
          published: valid.published,
        },
      })

      // 2. Update Skill relations (ProjectSkill)
      await tx.projectSkill.deleteMany({
        where: { projectId: id },
      })

      if (valid.skillIds.length > 0) {
        await tx.projectSkill.createMany({
          data: valid.skillIds.map((skillId) => ({
            projectId: id,
            skillId,
          })),
          skipDuplicates: true,
        })
      }
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/projects')
    revalidatePath(`/dashboard/projects/${id}/edit`)
    return {
      success: true,
      message: 'Proyek berhasil diperbarui',
      projectId: id,
    }
  } catch (error) {
    console.error('Error updating project:', error)
    return {
      success: false,
      message: 'Terjadi kesalahan saat memperbarui proyek.',
    }
  }
}

/**
 * 3. Toggle Status Published langsung dari daftar (DATA-04)
 * Unfeature saat unpublish agar tidak ada project featured yang tidak terlihat.
 */
export async function toggleProjectPublishedAction(id: string): Promise<ProjectActionState> {
  const admin = await requireAdmin()

  const project = await db.project.findFirst({
    where: {
      id,
      profile: { administratorId: admin.id },
    },
    select: { id: true, published: true, featured: true },
  })

  if (!project) {
    return { success: false, message: 'Proyek tidak ditemukan.' }
  }

  const nextPublished = !project.published
  // Jika diubah menjadi privat (false), featured otomatis dicopot (false)
  const nextFeatured = nextPublished ? project.featured : false

  await db.project.update({
    where: { id },
    data: {
      published: nextPublished,
      featured: nextFeatured,
    },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/projects')
  return {
    success: true,
    message: nextPublished ? 'Proyek kini dipublikasikan' : 'Proyek kini diatur privat',
  }
}

/**
 * 4. Toggle Status Featured langsung dari daftar (DATA-05)
 * Hanya boleh aktif bila project berstatus published.
 */
export async function toggleProjectFeaturedAction(id: string): Promise<ProjectActionState> {
  const admin = await requireAdmin()

  const project = await db.project.findFirst({
    where: {
      id,
      profile: { administratorId: admin.id },
    },
    select: { id: true, published: true, featured: true },
  })

  if (!project) {
    return { success: false, message: 'Proyek tidak ditemukan.' }
  }

  if (!project.published) {
    return {
      success: false,
      message: 'Proyek privat tidak dapat dijadikan Featured. Publikasikan proyek terlebih dahulu.',
    }
  }

  const nextFeatured = !project.featured

  await db.project.update({
    where: { id },
    data: { featured: nextFeatured },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/projects')
  return {
    success: true,
    message: nextFeatured ? 'Proyek ditandai sebagai Featured' : 'Tanda Featured dilepas',
  }
}

/**
 * 5. Reorder Sort Order (Up / Down) (DATA-06)
 */
export async function reorderProjectAction(
  id: string,
  direction: 'up' | 'down'
): Promise<ProjectActionState> {
  const admin = await requireAdmin()

  const profile = await db.profile.findUnique({
    where: { administratorId: admin.id },
    select: { id: true },
  })

  if (!profile) {
    return { success: false, message: 'Profil tidak ditemukan.' }
  }

  const allProjects = await db.project.findMany({
    where: { profileId: profile.id },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    select: { id: true, sortOrder: true },
  })

  const currentIndex = allProjects.findIndex((p) => p.id === id)
  if (currentIndex === -1) {
    return { success: false, message: 'Proyek tidak ditemukan.' }
  }

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= allProjects.length) {
    return { success: true, message: 'Posisi tidak berubah.' }
  }

  const currentProject = allProjects[currentIndex]
  const targetProject = allProjects[targetIndex]

  // Jika sortOrder sama, buat ulang urutan berurutan (0, 1, 2, ...) lalu swap
  if (currentProject.sortOrder === targetProject.sortOrder) {
    await db.$transaction(
      allProjects.map((p, index) => {
        let order = index
        if (index === currentIndex) order = targetIndex
        else if (index === targetIndex) order = currentIndex

        return db.project.update({
          where: { id: p.id },
          data: { sortOrder: order },
        })
      })
    )
  } else {
    // Swap nilai sortOrder
    await db.$transaction([
      db.project.update({
        where: { id: currentProject.id },
        data: { sortOrder: targetProject.sortOrder },
      }),
      db.project.update({
        where: { id: targetProject.id },
        data: { sortOrder: currentProject.sortOrder },
      }),
    ])
  }

  revalidatePath('/dashboard/projects')
  return { success: true, message: 'Urutan proyek berhasil diperbarui.' }
}

/**
 * 6. Hapus Project (DATA-01, DATA-07)
 * Jika project dipakai CvRecordSelection, tolak penghapusan dengan pesan jelas.
 */
export async function deleteProjectAction(id: string): Promise<ProjectActionState> {
  const admin = await requireAdmin()

  const project = await db.project.findFirst({
    where: {
      id,
      profile: { administratorId: admin.id },
    },
    include: {
      _count: {
        select: { cvSelections: true },
      },
    },
  })

  if (!project) {
    return { success: false, message: 'Proyek tidak ditemukan.' }
  }

  // DATA-07: Peringatan jika dipakai di CV
  if (project._count.cvSelections > 0) {
    return {
      success: false,
      message: `Proyek "${project.title}" tidak dapat dihapus karena sedang digunakan dalam ${project._count.cvSelections} konfigurasi CV. Lepas proyek dari CV tersebut terlebih dahulu.`,
    }
  }

  try {
    // Hapus file cover image jika ada
    if (project.coverImageUrl) {
      await deleteStoredFile(project.coverImageUrl)
    }

    await db.project.delete({
      where: { id },
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/projects')
    return { success: true, message: `Proyek "${project.title}" berhasil dihapus.` }
  } catch (error) {
    console.error('Error deleting project:', error)
    return {
      success: false,
      message: 'Terjadi kesalahan saat menghapus proyek.',
    }
  }
}
