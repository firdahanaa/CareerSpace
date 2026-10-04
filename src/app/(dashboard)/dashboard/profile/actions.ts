'use server'

import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { profileFormSchema, type OtherLinkItem } from '@/lib/validation/profile'
import { uploadProfilePhoto, deleteStoredFile } from '@/lib/storage'
import { revalidatePath } from 'next/cache'

export interface ProfileActionState {
  success: boolean
  message?: string
  fieldErrors?: Record<string, string[]>
  photoUrl?: string | null
}

export async function updateProfileAction(
  _prevState: ProfileActionState | null,
  formData: FormData
): Promise<ProfileActionState> {
  const admin = await requireAdmin()

  // 1. Parsing link tambahan (otherLinks)
  let parsedOtherLinks: OtherLinkItem[] = []
  try {
    const rawLinks = formData.get('otherLinks')
    if (typeof rawLinks === 'string' && rawLinks.trim() !== '') {
      parsedOtherLinks = JSON.parse(rawLinks)
    }
  } catch {
    return {
      success: false,
      message: 'Format data tautan tambahan tidak valid',
    }
  }

  // 2. Parsing field visibilitas kontak
  const showEmail = formData.get('showEmail') === 'true' || formData.get('showEmail') === 'on'
  const showPhone = formData.get('showPhone') === 'true' || formData.get('showPhone') === 'on'
  const showLocation = formData.get('showLocation') === 'true' || formData.get('showLocation') === 'on'
  const showLinkedin = formData.get('showLinkedin') === 'true' || formData.get('showLinkedin') === 'on'
  const showGithub = formData.get('showGithub') === 'true' || formData.get('showGithub') === 'on'

  // 3. Validasi dengan Zod
  const validationResult = profileFormSchema.safeParse({
    fullName: formData.get('fullName'),
    headline: formData.get('headline'),
    summary: formData.get('summary'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    location: formData.get('location'),
    linkedinUrl: formData.get('linkedinUrl'),
    githubUrl: formData.get('githubUrl'),
    otherLinks: parsedOtherLinks,
    showEmail,
    showPhone,
    showLocation,
    showLinkedin,
    showGithub,
  })

  if (!validationResult.success) {
    return {
      success: false,
      message: 'Validasi form gagal. Mohon periksa field yang ditandai merah.',
      fieldErrors: validationResult.error.flatten().fieldErrors,
    }
  }

  const validData = validationResult.data

  // 4. Penanganan upload foto baru & penghapusan foto lama
  const existingPhotoUrl = (formData.get('existingPhotoUrl') as string) || null
  const removePhoto = formData.get('removePhoto') === 'true'
  const photoFile = formData.get('photoFile') as File | null

  let updatedPhotoUrl = existingPhotoUrl

  try {
    if (removePhoto) {
      if (existingPhotoUrl) {
        await deleteStoredFile(existingPhotoUrl)
      }
      updatedPhotoUrl = null
    } else if (photoFile && photoFile.size > 0) {
      const uploadedUrl = await uploadProfilePhoto(photoFile)
      if (existingPhotoUrl && existingPhotoUrl !== uploadedUrl) {
        await deleteStoredFile(existingPhotoUrl)
      }
      updatedPhotoUrl = uploadedUrl
    }
  } catch (storageError) {
    const errorMsg = storageError instanceof Error ? storageError.message : 'Gagal mengunggah foto profil'
    return {
      success: false,
      message: errorMsg,
      fieldErrors: { photoFile: [errorMsg] },
    }
  }

  // 5. Simpan ke database (Upsert Profile & PortfolioSettings)
  try {
    const profile = await db.profile.upsert({
      where: { administratorId: admin.id },
      update: {
        fullName: validData.fullName,
        headline: validData.headline,
        summary: validData.summary,
        photoUrl: updatedPhotoUrl,
        email: validData.email,
        phone: validData.phone,
        location: validData.location,
        linkedinUrl: validData.linkedinUrl,
        githubUrl: validData.githubUrl,
        otherLinks: validData.otherLinks,
      },
      create: {
        administratorId: admin.id,
        fullName: validData.fullName,
        headline: validData.headline,
        summary: validData.summary,
        photoUrl: updatedPhotoUrl,
        email: validData.email,
        phone: validData.phone,
        location: validData.location,
        linkedinUrl: validData.linkedinUrl,
        githubUrl: validData.githubUrl,
        otherLinks: validData.otherLinks,
      },
    })

    const slugFallback =
      validData.fullName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'portfolio'

    await db.portfolioSettings.upsert({
      where: { profileId: profile.id },
      update: {
        showEmail: validData.showEmail,
        showPhone: validData.showPhone,
        showLocation: validData.showLocation,
        showLinkedin: validData.showLinkedin,
        showGithub: validData.showGithub,
      },
      create: {
        profileId: profile.id,
        slug: slugFallback,
        isPublished: false,
        showEmail: validData.showEmail,
        showPhone: validData.showPhone,
        showLocation: validData.showLocation,
        showLinkedin: validData.showLinkedin,
        showGithub: validData.showGithub,
      },
    })

    revalidatePath('/dashboard/profile')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: 'Profil dan pengaturan visibilitas kontak berhasil disimpan.',
      photoUrl: updatedPhotoUrl,
    }
  } catch (dbError) {
    console.error('Error updating profile in database:', dbError)
    return {
      success: false,
      message: 'Terjadi kesalahan sistem saat menyimpan ke database.',
    }
  }
}
