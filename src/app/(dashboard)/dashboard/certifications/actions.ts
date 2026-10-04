'use server'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { certificationFormSchema } from '@/lib/validation/certification'
import { revalidatePath } from 'next/cache'

export interface CertificationActionState {
  success: boolean
  message?: string
  fieldErrors?: Record<string, string[]>
  certificationId?: string
}

/**
 * 1. Tambah Sertifikasi & Pencapaian (PRD 5.6)
 */
export async function createCertificationAction(
  _prevState: CertificationActionState | null,
  formData: FormData
): Promise<CertificationActionState> {
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

  const title = formData.get('title')
  const issuer = formData.get('issuer')
  const issueDate = formData.get('issueDate')
  const expirationDate = formData.get('expirationDate')
  const credentialId = formData.get('credentialId')
  const credentialUrl = formData.get('credentialUrl')
  const description = formData.get('description')
  const published = formData.get('published') === 'true' || formData.get('published') === 'on'

  const validation = certificationFormSchema.safeParse({
    title,
    issuer,
    issueDate,
    expirationDate,
    credentialId,
    credentialUrl,
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

  const maxOrder = await db.certification.aggregate({
    where: { profileId: profile.id },
    _max: { sortOrder: true },
  })
  const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1

  try {
    const newCert = await db.certification.create({
      data: {
        profileId: profile.id,
        title: valid.title,
        issuer: valid.issuer,
        issueDate: valid.issueDate ? new Date(valid.issueDate) : null,
        expirationDate: valid.expirationDate ? new Date(valid.expirationDate) : null,
        credentialId: valid.credentialId,
        credentialUrl: valid.credentialUrl,
        description: valid.description,
        published: valid.published,
        sortOrder: nextOrder,
      },
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/certifications')
    return {
      success: true,
      message: `Sertifikasi / Pencapaian "${newCert.title}" berhasil ditambahkan.`,
      certificationId: newCert.id,
    }
  } catch (error) {
    console.error('Error creating certification:', error)
    return {
      success: false,
      message: 'Terjadi kesalahan saat menyimpan data sertifikasi.',
    }
  }
}

/**
 * 2. Update Sertifikasi & Pencapaian
 */
export async function updateCertificationAction(
  id: string,
  _prevState: CertificationActionState | null,
  formData: FormData
): Promise<CertificationActionState> {
  const admin = await requireAdmin()

  const existingCert = await db.certification.findFirst({
    where: {
      id,
      profile: { administratorId: admin.id },
    },
  })

  if (!existingCert) {
    return {
      success: false,
      message: 'Data sertifikasi tidak ditemukan atau Anda tidak memiliki izin.',
    }
  }

  const title = formData.get('title')
  const issuer = formData.get('issuer')
  const issueDate = formData.get('issueDate')
  const expirationDate = formData.get('expirationDate')
  const credentialId = formData.get('credentialId')
  const credentialUrl = formData.get('credentialUrl')
  const description = formData.get('description')
  const published = formData.get('published') === 'true' || formData.get('published') === 'on'

  const validation = certificationFormSchema.safeParse({
    title,
    issuer,
    issueDate,
    expirationDate,
    credentialId,
    credentialUrl,
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
    await db.certification.update({
      where: { id },
      data: {
        title: valid.title,
        issuer: valid.issuer,
        issueDate: valid.issueDate ? new Date(valid.issueDate) : null,
        expirationDate: valid.expirationDate ? new Date(valid.expirationDate) : null,
        credentialId: valid.credentialId,
        credentialUrl: valid.credentialUrl,
        description: valid.description,
        published: valid.published,
      },
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/certifications')
    return {
      success: true,
      message: `Sertifikasi / Pencapaian "${valid.title}" berhasil diperbarui.`,
      certificationId: id,
    }
  } catch (error) {
    console.error('Error updating certification:', error)
    return {
      success: false,
      message: 'Terjadi kesalahan saat memperbarui data sertifikasi.',
    }
  }
}

/**
 * 3. Toggle Published
 */
export async function toggleCertificationPublishedAction(
  id: string
): Promise<CertificationActionState> {
  const admin = await requireAdmin()

  const cert = await db.certification.findFirst({
    where: {
      id,
      profile: { administratorId: admin.id },
    },
    select: { id: true, title: true, published: true },
  })

  if (!cert) {
    return { success: false, message: 'Data sertifikasi tidak ditemukan.' }
  }

  const nextPublished = !cert.published

  await db.certification.update({
    where: { id },
    data: { published: nextPublished },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/certifications')
  return {
    success: true,
    message: nextPublished
      ? `"${cert.title}" dipublikasikan ke portofolio.`
      : `"${cert.title}" diatur menjadi privat.`,
  }
}

/**
 * 4. Reorder Up / Down (DATA-06)
 */
export async function reorderCertificationAction(
  id: string,
  direction: 'up' | 'down'
): Promise<CertificationActionState> {
  const admin = await requireAdmin()

  const profile = await db.profile.findUnique({
    where: { administratorId: admin.id },
    select: { id: true },
  })

  if (!profile) {
    return { success: false, message: 'Profil tidak ditemukan.' }
  }

  const allCertifications = await db.certification.findMany({
    where: { profileId: profile.id },
    orderBy: [
      { sortOrder: 'asc' },
      { issueDate: 'desc' },
      { createdAt: 'desc' },
    ],
    select: { id: true, sortOrder: true },
  })

  const currentIndex = allCertifications.findIndex((c) => c.id === id)
  if (currentIndex === -1) {
    return { success: false, message: 'Data sertifikasi tidak ditemukan.' }
  }

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= allCertifications.length) {
    return { success: true, message: 'Posisi tidak berubah.' }
  }

  const currentItem = allCertifications[currentIndex]
  const targetItem = allCertifications[targetIndex]

  if (currentItem.sortOrder === targetItem.sortOrder) {
    await db.$transaction(
      allCertifications.map((c, index) => {
        let order = index
        if (index === currentIndex) order = targetIndex
        else if (index === targetIndex) order = currentIndex

        return db.certification.update({
          where: { id: c.id },
          data: { sortOrder: order },
        })
      })
    )
  } else {
    await db.$transaction([
      db.certification.update({
        where: { id: currentItem.id },
        data: { sortOrder: targetItem.sortOrder },
      }),
      db.certification.update({
        where: { id: targetItem.id },
        data: { sortOrder: currentItem.sortOrder },
      }),
    ])
  }

  revalidatePath('/dashboard/certifications')
  return { success: true, message: 'Urutan sertifikasi berhasil diperbarui.' }
}

/**
 * 5. Hapus Certification (DATA-07)
 */
export async function deleteCertificationAction(id: string): Promise<CertificationActionState> {
  const admin = await requireAdmin()

  const cert = await db.certification.findFirst({
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

  if (!cert) {
    return { success: false, message: 'Data sertifikasi tidak ditemukan.' }
  }

  if (cert._count.cvSelections > 0) {
    return {
      success: false,
      message: `"${cert.title}" tidak dapat dihapus karena sedang digunakan dalam ${cert._count.cvSelections} konfigurasi CV. Lepaskan dari CV tersebut terlebih dahulu.`,
    }
  }

  try {
    await db.certification.delete({
      where: { id },
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/certifications')
    return {
      success: true,
      message: `"${cert.title}" berhasil dihapus.`,
    }
  } catch (error) {
    console.error('Error deleting certification:', error)
    return {
      success: false,
      message: 'Terjadi kesalahan saat menghapus data sertifikasi.',
    }
  }
}
