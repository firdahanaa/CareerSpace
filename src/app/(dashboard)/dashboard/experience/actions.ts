'use server'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { experienceFormSchema } from '@/lib/validation/experience'
import { revalidatePath } from 'next/cache'

export interface ExperienceActionState {
  success: boolean
  message?: string
  fieldErrors?: Record<string, string[]>
  experienceId?: string
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
 * 1. Tambah Experience Baru (PRD 5.3)
 */
export async function createExperienceAction(
  _prevState: ExperienceActionState | null,
  formData: FormData
): Promise<ExperienceActionState> {
  const admin = await requireAdmin()

  const profile = await db.profile.findUnique({
    where: { administratorId: admin.id },
    select: { id: true },
  })

  if (!profile) {
    return {
      success: false,
      message: 'Profil administrator belum ditemukan. Harap lengkapi profil terlebih dahulu.',
    }
  }

  const organization = formData.get('organization')
  const position = formData.get('position')
  const category = formData.get('category')
  const location = formData.get('location')
  const startDate = formData.get('startDate')
  const isCurrent = formData.get('isCurrent') === 'true' || formData.get('isCurrent') === 'on'
  const endDate = isCurrent ? null : formData.get('endDate')
  const description = formData.get('description')
  const published = formData.get('published') === 'true' || formData.get('published') === 'on'

  const responsibilities = parseJsonArray(formData.get('responsibilities'))
  const achievements = parseJsonArray(formData.get('achievements'))
  const skillIds = parseJsonArray(formData.get('skillIds'))

  const validation = experienceFormSchema.safeParse({
    organization,
    position,
    category,
    location,
    startDate,
    endDate,
    isCurrent,
    description,
    responsibilities,
    achievements,
    published,
    skillIds,
  })

  if (!validation.success) {
    return {
      success: false,
      message: 'Terdapat kesalahan pada isian form.',
      fieldErrors: validation.error.flatten().fieldErrors,
    }
  }

  const valid = validation.data

  // Hitung sortOrder berikutnya
  const maxOrder = await db.experience.aggregate({
    where: { profileId: profile.id },
    _max: { sortOrder: true },
  })
  const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1

  try {
    const newExp = await db.experience.create({
      data: {
        profileId: profile.id,
        organization: valid.organization,
        position: valid.position,
        category: valid.category,
        location: valid.location,
        startDate: valid.startDate ? new Date(valid.startDate) : null,
        endDate: valid.isCurrent || !valid.endDate ? null : new Date(valid.endDate),
        isCurrent: valid.isCurrent,
        description: valid.description,
        responsibilities: valid.responsibilities,
        achievements: valid.achievements,
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
    revalidatePath('/dashboard/experience')
    return {
      success: true,
      message: `Pengalaman di "${newExp.organization}" berhasil ditambahkan.`,
      experienceId: newExp.id,
    }
  } catch (error) {
    console.error('Error creating experience:', error)
    return {
      success: false,
      message: 'Terjadi kesalahan saat menyimpan pengalaman ke database.',
    }
  }
}

/**
 * 2. Update Experience
 */
export async function updateExperienceAction(
  id: string,
  _prevState: ExperienceActionState | null,
  formData: FormData
): Promise<ExperienceActionState> {
  const admin = await requireAdmin()

  const existingExp = await db.experience.findFirst({
    where: {
      id,
      profile: { administratorId: admin.id },
    },
  })

  if (!existingExp) {
    return {
      success: false,
      message: 'Pengalaman tidak ditemukan atau Anda tidak memiliki izin untuk mengeditnya.',
    }
  }

  const organization = formData.get('organization')
  const position = formData.get('position')
  const category = formData.get('category')
  const location = formData.get('location')
  const startDate = formData.get('startDate')
  const isCurrent = formData.get('isCurrent') === 'true' || formData.get('isCurrent') === 'on'
  const endDate = isCurrent ? null : formData.get('endDate')
  const description = formData.get('description')
  const published = formData.get('published') === 'true' || formData.get('published') === 'on'

  const responsibilities = parseJsonArray(formData.get('responsibilities'))
  const achievements = parseJsonArray(formData.get('achievements'))
  const skillIds = parseJsonArray(formData.get('skillIds'))

  const validation = experienceFormSchema.safeParse({
    organization,
    position,
    category,
    location,
    startDate,
    endDate,
    isCurrent,
    description,
    responsibilities,
    achievements,
    published,
    skillIds,
  })

  if (!validation.success) {
    return {
      success: false,
      message: 'Terdapat kesalahan pada isian form.',
      fieldErrors: validation.error.flatten().fieldErrors,
    }
  }

  const valid = validation.data

  try {
    await db.$transaction(async (tx) => {
      // 1. Update experience
      await tx.experience.update({
        where: { id },
        data: {
          organization: valid.organization,
          position: valid.position,
          category: valid.category,
          location: valid.location,
          startDate: valid.startDate ? new Date(valid.startDate) : null,
          endDate: valid.isCurrent || !valid.endDate ? null : new Date(valid.endDate),
          isCurrent: valid.isCurrent,
          description: valid.description,
          responsibilities: valid.responsibilities,
          achievements: valid.achievements,
          published: valid.published,
        },
      })

      // 2. Update skills relations (ExperienceSkill)
      await tx.experienceSkill.deleteMany({
        where: { experienceId: id },
      })

      if (valid.skillIds.length > 0) {
        await tx.experienceSkill.createMany({
          data: valid.skillIds.map((skillId) => ({
            experienceId: id,
            skillId,
          })),
          skipDuplicates: true,
        })
      }
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/experience')
    revalidatePath(`/dashboard/experience/${id}/edit`)
    return {
      success: true,
      message: `Pengalaman di "${valid.organization}" berhasil diperbarui.`,
      experienceId: id,
    }
  } catch (error) {
    console.error('Error updating experience:', error)
    return {
      success: false,
      message: 'Terjadi kesalahan saat memperbarui pengalaman.',
    }
  }
}

/**
 * 3. Toggle Status Published Experience
 */
export async function toggleExperiencePublishedAction(id: string): Promise<ExperienceActionState> {
  const admin = await requireAdmin()

  const exp = await db.experience.findFirst({
    where: {
      id,
      profile: { administratorId: admin.id },
    },
    select: { id: true, organization: true, published: true },
  })

  if (!exp) {
    return { success: false, message: 'Pengalaman tidak ditemukan.' }
  }

  const nextPublished = !exp.published

  await db.experience.update({
    where: { id },
    data: { published: nextPublished },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/experience')
  return {
    success: true,
    message: nextPublished
      ? `Pengalaman di "${exp.organization}" dipublikasikan ke portofolio.`
      : `Pengalaman di "${exp.organization}" diatur menjadi privat.`,
  }
}

/**
 * 4. Reorder Experience (Up / Down) (DATA-06)
 */
export async function reorderExperienceAction(
  id: string,
  direction: 'up' | 'down'
): Promise<ExperienceActionState> {
  const admin = await requireAdmin()

  const profile = await db.profile.findUnique({
    where: { administratorId: admin.id },
    select: { id: true },
  })

  if (!profile) {
    return { success: false, message: 'Profil tidak ditemukan.' }
  }

  const allExperiences = await db.experience.findMany({
    where: { profileId: profile.id },
    orderBy: [
      { sortOrder: 'asc' },
      { startDate: 'desc' },
      { createdAt: 'desc' },
    ],
    select: { id: true, sortOrder: true },
  })

  const currentIndex = allExperiences.findIndex((e) => e.id === id)
  if (currentIndex === -1) {
    return { success: false, message: 'Pengalaman tidak ditemukan.' }
  }

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= allExperiences.length) {
    return { success: true, message: 'Posisi tidak berubah.' }
  }

  const currentItem = allExperiences[currentIndex]
  const targetItem = allExperiences[targetIndex]

  if (currentItem.sortOrder === targetItem.sortOrder) {
    await db.$transaction(
      allExperiences.map((e, index) => {
        let order = index
        if (index === currentIndex) order = targetIndex
        else if (index === targetIndex) order = currentIndex

        return db.experience.update({
          where: { id: e.id },
          data: { sortOrder: order },
        })
      })
    )
  } else {
    await db.$transaction([
      db.experience.update({
        where: { id: currentItem.id },
        data: { sortOrder: targetItem.sortOrder },
      }),
      db.experience.update({
        where: { id: targetItem.id },
        data: { sortOrder: currentItem.sortOrder },
      }),
    ])
  }

  revalidatePath('/dashboard/experience')
  return { success: true, message: 'Urutan pengalaman berhasil diperbarui.' }
}

/**
 * 5. Hapus Experience (DATA-07)
 */
export async function deleteExperienceAction(id: string): Promise<ExperienceActionState> {
  const admin = await requireAdmin()

  const exp = await db.experience.findFirst({
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

  if (!exp) {
    return { success: false, message: 'Pengalaman tidak ditemukan.' }
  }

  if (exp._count.cvSelections > 0) {
    return {
      success: false,
      message: `Pengalaman di "${exp.organization}" tidak dapat dihapus karena sedang digunakan dalam ${exp._count.cvSelections} konfigurasi CV. Lepaskan pengalaman dari CV tersebut terlebih dahulu.`,
    }
  }

  try {
    await db.experience.delete({
      where: { id },
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/experience')
    return {
      success: true,
      message: `Pengalaman di "${exp.organization}" berhasil dihapus.`,
    }
  } catch (error) {
    console.error('Error deleting experience:', error)
    return {
      success: false,
      message: 'Terjadi kesalahan saat menghapus pengalaman.',
    }
  }
}
