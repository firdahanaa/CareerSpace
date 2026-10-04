import { put, del } from '@vercel/blob'
import path from 'path'
import fs from 'fs/promises'

export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024 // 2MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function validateImageFile(file: { size: number; type: string }): {
  valid: boolean
  error?: string
} {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Format foto tidak didukung. Harap gunakan format JPEG, PNG, atau WebP.',
    }
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Ukuran foto melebihi batas maksimal 2MB.',
    }
  }

  return { valid: true }
}

/**
 * Upload gambar menggunakan Vercel Blob atau fallback lokal
 */
export async function uploadImage(file: File, folder: 'avatars' | 'projects'): Promise<string> {
  const validation = validateImageFile(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const extension = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1] || 'png'
  const prefix = folder === 'avatars' ? 'profile' : 'project'
  const uniqueName = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`

  // Mode Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`${folder}/${uniqueName}`, file, {
      access: 'public',
    })
    return blob.url
  }

  // Fallback penyimpanan lokal untuk development
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder)
  await fs.mkdir(uploadDir, { recursive: true })

  const filePath = path.join(uploadDir, uniqueName)
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  await fs.writeFile(filePath, buffer)

  return `/uploads/${folder}/${uniqueName}`
}

/**
 * Upload foto profil menggunakan Vercel Blob (jika BLOB_READ_WRITE_TOKEN tersedia),
 * atau fallback ke penyimpanan lokal di public/uploads/avatars untuk development.
 */
export async function uploadProfilePhoto(file: File): Promise<string> {
  return uploadImage(file, 'avatars')
}

/**
 * Upload cover image project ke folder projects.
 */
export async function uploadProjectCover(file: File): Promise<string> {
  return uploadImage(file, 'projects')
}

/**
 * Menghapus file foto lama saat diganti atau dihapus.
 */
export async function deleteStoredFile(fileUrl?: string | null): Promise<void> {
  if (!fileUrl) return

  try {
    // Jika file tersimpan di Vercel Blob
    if (fileUrl.includes('vercel-storage.com') || fileUrl.includes('blob.vercel-storage.com')) {
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        await del(fileUrl)
      }
      return
    }

    // Jika file tersimpan di folder lokal public/uploads
    if (fileUrl.startsWith('/uploads/')) {
      const relativePath = fileUrl.replace(/^\//, '')
      const localFilePath = path.join(process.cwd(), 'public', relativePath)
      await fs.unlink(localFilePath).catch(() => {
        // Abaikan jika file sudah tidak ada di disk
      })
    }
  } catch (error) {
    console.warn(`Gagal menghapus file lama (${fileUrl}):`, error)
  }
}
