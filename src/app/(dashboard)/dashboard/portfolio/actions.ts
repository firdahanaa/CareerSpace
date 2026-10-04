'use server'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { portfolioSettingsSchema } from '@/lib/validation/portfolio'
import { revalidatePath } from 'next/cache'

export interface PortfolioActionState {
  success: boolean
  message?: string
  fieldErrors?: Record<string, string[]>
  isPublished?: boolean
  slug?: string
}

/**
 * 1. Update Pengaturan Portofolio: Saklar isPublished dan Slug Publik (PRD 3A, 5.8)
 *
 * CRITICAL FLOW A RULE:
 * Mengubah status published portofolio TIDAK BOLEH mengubah status published
 * record karier apa pun (PRD Bagian 6 Flow A & AGENTS.md Bagian 4 Aturan 4).
 */
export async function updatePortfolioSettingsAction(
  _prevState: PortfolioActionState | null,
  formData: FormData
): Promise<PortfolioActionState> {
  const admin = await requireAdmin()

  const profile = await db.profile.findUnique({
    where: { administratorId: admin.id },
    include: { settings: true },
  })

  if (!profile) {
    return {
      success: false,
      message: 'Profil administrator tidak ditemukan. Harap lengkapi profil terlebih dahulu.',
    }
  }

  const rawSlug = formData.get('slug')
  const isPublished =
    formData.get('isPublished') === 'true' || formData.get('isPublished') === 'on'

  const validation = portfolioSettingsSchema.safeParse({
    slug: rawSlug,
    isPublished,
  })

  if (!validation.success) {
    return {
      success: false,
      message: 'Validasi pengaturan portofolio gagal. Periksa kembali isian Anda.',
      fieldErrors: validation.error.flatten().fieldErrors,
    }
  }

  const valid = validation.data

  // Periksa keunikan slug di seluruh database
  const slugConflict = await db.portfolioSettings.findFirst({
    where: {
      slug: valid.slug,
      profileId: { not: profile.id },
    },
    select: { id: true },
  })

  if (slugConflict) {
    return {
      success: false,
      message: `Slug "${valid.slug}" sudah digunakan oleh akun lain. Silakan pilih slug lain.`,
      fieldErrors: {
        slug: ['Slug ini sudah digunakan. Harap gunakan nama atau variasi lain.'],
      },
    }
  }

  try {
    const updatedSettings = await db.portfolioSettings.upsert({
      where: { profileId: profile.id },
      update: {
        slug: valid.slug,
        isPublished: valid.isPublished,
      },
      create: {
        profileId: profile.id,
        slug: valid.slug,
        isPublished: valid.isPublished,
      },
    })

    // Revalidate paths
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/portfolio')
    revalidatePath('/dashboard/portfolio/preview')
    revalidatePath(`/${updatedSettings.slug}`)

    const statusMsg = updatedSettings.isPublished
      ? 'Portofolio publik berhasil diaktifkan dan dapat diakses pengunjung.'
      : 'Portofolio publik diatur menjadi draf (privat).'

    return {
      success: true,
      message: `Pengaturan berhasil disimpan. ${statusMsg}`,
      isPublished: updatedSettings.isPublished,
      slug: updatedSettings.slug,
    }
  } catch (error) {
    console.error('Error updating portfolio settings:', error)
    return {
      success: false,
      message: 'Terjadi kesalahan sistem saat menyimpan pengaturan portofolio.',
    }
  }
}

/**
 * 2. Toggle status published portofolio cepat
 */
export async function togglePortfolioPublishedAction(): Promise<PortfolioActionState> {
  const admin = await requireAdmin()

  const profile = await db.profile.findUnique({
    where: { administratorId: admin.id },
    include: { settings: true },
  })

  if (!profile || !profile.settings) {
    return {
      success: false,
      message: 'Pengaturan portofolio belum tersedia.',
    }
  }

  const nextPublished = !profile.settings.isPublished

  await db.portfolioSettings.update({
    where: { profileId: profile.id },
    data: { isPublished: nextPublished },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/portfolio')
  revalidatePath('/dashboard/portfolio/preview')
  revalidatePath(`/${profile.settings.slug}`)

  return {
    success: true,
    message: nextPublished
      ? 'Portofolio publik sekarang aktif.'
      : 'Portofolio publik sekarang nonaktif (draf).',
    isPublished: nextPublished,
  }
}

/**
 * 3. Toggle Featured Cepat untuk Project (PORT-04)
 */
export async function toggleProjectFeaturedQuickAction(
  projectId: string
): Promise<{ success: boolean; message: string }> {
  const admin = await requireAdmin()

  const project = await db.project.findFirst({
    where: {
      id: projectId,
      profile: { administratorId: admin.id },
    },
    select: { id: true, title: true, featured: true },
  })

  if (!project) {
    return { success: false, message: 'Proyek tidak ditemukan.' }
  }

  const nextFeatured = !project.featured

  await db.project.update({
    where: { id: projectId },
    data: { featured: nextFeatured },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/portfolio')
  revalidatePath('/dashboard/projects')

  return {
    success: true,
    message: nextFeatured
      ? `Proyek "${project.title}" ditandai sebagai Unggulan (Featured).`
      : `Proyek "${project.title}" dilepas dari status Unggulan.`,
  }
}

/**
 * 4. Toggle Published Cepat untuk record apa pun di Ringkasan Konten Portofolio
 */
export async function toggleRecordPublishedQuickAction(
  recordId: string,
  recordType: 'PROJECT' | 'EXPERIENCE' | 'EDUCATION' | 'SKILLS' | 'CERTIFICATION'
): Promise<{ success: boolean; message: string }> {
  const admin = await requireAdmin()

  try {
    switch (recordType) {
      case 'PROJECT': {
        const item = await db.project.findFirst({
          where: { id: recordId, profile: { administratorId: admin.id } },
          select: { id: true, title: true, published: true },
        })
        if (!item) return { success: false, message: 'Proyek tidak ditemukan.' }
        const nextPub = !item.published
        await db.project.update({ where: { id: recordId }, data: { published: nextPub } })
        revalidatePath('/dashboard/projects')
        break
      }
      case 'EXPERIENCE': {
        const item = await db.experience.findFirst({
          where: { id: recordId, profile: { administratorId: admin.id } },
          select: { id: true, position: true, published: true },
        })
        if (!item) return { success: false, message: 'Pengalaman tidak ditemukan.' }
        const nextPub = !item.published
        await db.experience.update({ where: { id: recordId }, data: { published: nextPub } })
        revalidatePath('/dashboard/experience')
        break
      }
      case 'EDUCATION': {
        const item = await db.education.findFirst({
          where: { id: recordId, profile: { administratorId: admin.id } },
          select: { id: true, institution: true, published: true },
        })
        if (!item) return { success: false, message: 'Pendidikan tidak ditemukan.' }
        const nextPub = !item.published
        await db.education.update({ where: { id: recordId }, data: { published: nextPub } })
        revalidatePath('/dashboard/education')
        break
      }
      case 'SKILLS': {
        const item = await db.skill.findFirst({
          where: { id: recordId, profile: { administratorId: admin.id } },
          select: { id: true, name: true, published: true },
        })
        if (!item) return { success: false, message: 'Keahlian tidak ditemukan.' }
        const nextPub = !item.published
        await db.skill.update({ where: { id: recordId }, data: { published: nextPub } })
        revalidatePath('/dashboard/skills')
        break
      }
      case 'CERTIFICATION': {
        const item = await db.certification.findFirst({
          where: { id: recordId, profile: { administratorId: admin.id } },
          select: { id: true, title: true, published: true },
        })
        if (!item) return { success: false, message: 'Sertifikasi tidak ditemukan.' }
        const nextPub = !item.published
        await db.certification.update({ where: { id: recordId }, data: { published: nextPub } })
        revalidatePath('/dashboard/certifications')
        break
      }
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/portfolio')
    revalidatePath('/dashboard/portfolio/preview')

    return { success: true, message: 'Status publikasi diperbarui.' }
  } catch (error) {
    console.error('Error toggling record publication in portfolio:', error)
    return { success: false, message: 'Gagal memperbarui status publikasi record.' }
  }
}
