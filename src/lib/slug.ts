import { db } from '@/lib/db'

/**
 * Mengubah string menjadi format slug ramah URL.
 * Contoh: "E-Commerce App v2!" -> "e-commerce-app-v2"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Hapus karakter selain huruf, angka, underscore, dash, dan spasi
    .replace(/[\s_-]+/g, '-') // Ganti spasi, underscore, dash ganda dengan dash tunggal
    .replace(/^-+|-+$/g, '') // Hapus dash di awal dan akhir
}

/**
 * Menghasilkan slug yang unik per profileId di tabel Project.
 * Jika slug sudah terpakai oleh project lain, tambahkan sufiks -1, -2, dst.
 */
export async function resolveUniqueProjectSlug(
  profileId: string,
  rawTitleOrSlug: string,
  excludeProjectId?: string
): Promise<string> {
  const base = slugify(rawTitleOrSlug) || 'project'
  let candidate = base
  let counter = 1

  while (true) {
    const existing = await db.project.findFirst({
      where: {
        profileId,
        slug: candidate,
        ...(excludeProjectId ? { NOT: { id: excludeProjectId } } : {}),
      },
      select: { id: true },
    })

    if (!existing) {
      return candidate
    }

    candidate = `${base}-${counter}`
    counter++
  }
}
