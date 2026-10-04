import { z } from 'zod'

export const RESERVED_SLUGS = [
  'dashboard',
  'login',
  'logout',
  'api',
  'admin',
  'cv',
  'cvs',
  'portfolio',
  'preview',
  'projects',
  'experience',
  'education',
  'skills',
  'certifications',
  'settings',
  'profile',
  'about',
  'contact',
] as const

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Slug minimal 3 karakter')
  .max(50, 'Slug maksimal 50 karakter')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-), serta tidak diawali/diakhiri tanda hubung'
  )
  .refine(
    (slug) => !RESERVED_SLUGS.includes(slug as (typeof RESERVED_SLUGS)[number]),
    {
      message: 'Slug ini merupakan kata kunci sistem dan tidak dapat digunakan sebagai alamat portofolio',
    }
  )

export const portfolioSettingsSchema = z.object({
  slug: slugSchema,
  isPublished: z.boolean().default(false),
})

export type PortfolioSettingsFormData = z.infer<typeof portfolioSettingsSchema>

/**
 * Memeriksa apakah profil administrator sudah memenuhi kelengkapan minimal
 * untuk ditampilkan secara publik (nama lengkap dan headline wajib).
 */
export function isProfileComplete(
  profile?: { fullName?: string | null; headline?: string | null } | null
): boolean {
  if (!profile) return false
  const hasName = Boolean(profile.fullName && profile.fullName.trim().length > 0)
  const hasHeadline = Boolean(profile.headline && profile.headline.trim().length > 0)
  return hasName && hasHeadline
}
