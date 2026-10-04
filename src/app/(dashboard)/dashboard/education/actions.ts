'use server'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { educationFormSchema } from '@/lib/validation/education'
import { revalidatePath } from 'next/cache'

export interface EducationActionState {
  success: boolean
  message?: string
  fieldErrors?: Record<string, string[]>
  educationId?: string
}

/**
 * 1. Tambah Riwayat Pendidikan (PRD 5.4)
 */
export async function createEducationAction(
  _prevState: EducationActionState | null,
  formData: FormData
): Promise<EducationActionState> {
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

  const institution = formData.get('institution')
  const degree = formData.get('degree')
  const fieldOfStudy = formData.get('fieldOfStudy')
  const startDate = formData.get('startDate')
  const isCurrent = formData.get('isCurrent') === 'true' || formData.get('isCurrent') === 'on'
  const endDate = isCurrent ? null : formData.get('endDate')
  const gpa = formData.get('gpa')
  const description = formData.get('description')
  const published = formData.get('published') === 'true' || formData.get('published') === 'on'

  const validation = educationFormSchema.safeParse({
    institution,
    degree,
    fieldOfStudy,
    startDate,
    endDate,
    isCurrent,
    gpa,
    description,
    published,
  })

  if (!validation.success) {
    return {
      success: false,
      message: 'Terdapat kesalahan pada isian form.',
      fieldErrors: validation.error.flatten().fieldErrors,
    }
  }

  const valid = validation.data

  const maxOrder = await db.education.aggregate({
    where: { profileId: profile.id },
    _max: { sortOrder: true },
  })
  const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1

  try {
    const newEdu = await db.education.create({
      data: {
        profileId: profile.id,
        institution: valid.institution,
        degree: valid.degree,
        fieldOfStudy: valid.fieldOfStudy,
        startDate: valid.startDate ? new Date(valid.startDate) : null,
        endDate: valid.isCurrent || !valid.endDate ? null : new Date(valid.endDate),
        isCurrent: valid.isCurrent,
        gpa: valid.gpa,
        description: valid.description,
        published: valid.published,
        sortOrder: nextOrder,
      },
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/education')
    return {
      success: true,
      message: `Pendidikan di "${newEdu.institution}" berhasil ditambahkan.`,
      educationId: newEdu.id,
    }
  } catch (error) {
    console.error('Error creating education:', error)
    return {
      success: false,
      message: 'Terjadi kesalahan saat menyimpan data pendidikan.',
    }
  }
}

/**
 * 2. Update Riwayat Pendidikan
 */
export async function updateEducationAction(
  id: string,
  _prevState: EducationActionState | null,
  formData: FormData
): Promise<EducationActionState> {
  const admin = await requireAdmin()

  const existingEdu = await db.education.findFirst({
    where: {
      id,
      profile: { administratorId: admin.id },
    },
  })

  if (!existingEdu) {
    return {
      success: false,
      message: 'Data pendidikan tidak ditemukan atau Anda tidak memiliki izin.',
    }
  }

  const institution = formData.get('institution')
  const degree = formData.get('degree')
  const fieldOfStudy = formData.get('fieldOfStudy')
  const startDate = formData.get('startDate')
  const isCurrent = formData.get('isCurrent') === 'true' || formData.get('isCurrent') === 'on'
  const endDate = isCurrent ? null : formData.get('endDate')
  const gpa = formData.get('gpa')
  const description = formData.get('description')
  const published = formData.get('published') === 'true' || formData.get('published') === 'on'

  const validation = educationFormSchema.safeParse({
    institution,
    degree,
    fieldOfStudy,
    startDate,
    endDate,
    isCurrent,
    gpa,
    description,
    published,
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
    await db.education.update({
      where: { id },
      data: {
        institution: valid.institution,
        degree: valid.degree,
        fieldOfStudy: valid.fieldOfStudy,
        startDate: valid.startDate ? new Date(valid.startDate) : null,
        endDate: valid.isCurrent || !valid.endDate ? null : new Date(valid.endDate),
        isCurrent: valid.isCurrent,
        gpa: valid.gpa,
        description: valid.description,
        published: valid.published,
      },
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/education')
    return {
      success: true,
      message: `Pendidikan di "${valid.institution}" berhasil diperbarui.`,
      educationId: id,
    }
  } catch (error) {
    console.error('Error updating education:', error)
    return {
      success: false,
      message: 'Terjadi kesalahan saat memperbarui data pendidikan.',
    }
  }
}

/**
 * 3. Toggle Published
 */
export async function toggleEducationPublishedAction(id: string): Promise<EducationActionState> {
  const admin = await requireAdmin()

  const edu = await db.education.findFirst({
    where: {
      id,
      profile: { administratorId: admin.id },
    },
    select: { id: true, institution: true, published: true },
  })

  if (!edu) {
    return { success: false, message: 'Data pendidikan tidak ditemukan.' }
  }

  const nextPublished = !edu.published

  await db.education.update({
    where: { id },
    data: { published: nextPublished },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/education')
  return {
    success: true,
    message: nextPublished
      ? `Pendidikan di "${edu.institution}" dipublikasikan ke portofolio.`
      : `Pendidikan di "${edu.institution}" diatur menjadi privat.`,
  }
}

/**
 * 4. Reorder Up / Down (DATA-06)
 */
export async function reorderEducationAction(
  id: string,
  direction: 'up' | 'down'
): Promise<EducationActionState> {
  const admin = await requireAdmin()

  const profile = await db.profile.findUnique({
    where: { administratorId: admin.id },
    select: { id: true },
  })

  if (!profile) {
    return { success: false, message: 'Profil tidak ditemukan.' }
  }

  const allEducations = await db.education.findMany({
    where: { profileId: profile.id },
    orderBy: [
      { sortOrder: 'asc' },
      { startDate: 'desc' },
      { createdAt: 'desc' },
    ],
    select: { id: true, sortOrder: true },
  })

  const currentIndex = allEducations.findIndex((e) => e.id === id)
  if (currentIndex === -1) {
    return { success: false, message: 'Data pendidikan tidak ditemukan.' }
  }

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= allEducations.length) {
    return { success: true, message: 'Posisi tidak berubah.' }
  }

  const currentItem = allEducations[currentIndex]
  const targetItem = allEducations[targetIndex]

  if (currentItem.sortOrder === targetItem.sortOrder) {
    await db.$transaction(
      allEducations.map((e, index) => {
        let order = index
        if (index === currentIndex) order = targetIndex
        else if (index === targetIndex) order = currentIndex

        return db.education.update({
          where: { id: e.id },
          data: { sortOrder: order },
        })
      })
    )
  } else {
    await db.$transaction([
      db.education.update({
        where: { id: currentItem.id },
        data: { sortOrder: targetItem.sortOrder },
      }),
      db.education.update({
        where: { id: targetItem.id },
        data: { sortOrder: currentItem.sortOrder },
      }),
    ])
  }

  revalidatePath('/dashboard/education')
  return { success: true, message: 'Urutan pendidikan berhasil diperbarui.' }
}

/**
 * 5. Hapus Education (DATA-07)
 */
export async function deleteEducationAction(id: string): Promise<EducationActionState> {
  const admin = await requireAdmin()

  const edu = await db.education.findFirst({
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

  if (!edu) {
    return { success: false, message: 'Data pendidikan tidak ditemukan.' }
  }

  if (edu._count.cvSelections > 0) {
    return {
      success: false,
      message: `Pendidikan di "${edu.institution}" tidak dapat dihapus karena sedang digunakan dalam ${edu._count.cvSelections} konfigurasi CV. Lepaskan dari CV tersebut terlebih dahulu.`,
    }
  }

  try {
    await db.education.delete({
      where: { id },
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/education')
    return {
      success: true,
      message: `Pendidikan di "${edu.institution}" berhasil dihapus.`,
    }
  } catch (error) {
    console.error('Error deleting education:', error)
    return {
      success: false,
      message: 'Terjadi kesalahan saat menghapus data pendidikan.',
    }
  }
}
