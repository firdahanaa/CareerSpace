import { z } from 'zod'

export const otherLinkItemSchema = z.object({
  label: z.string().trim().min(1, 'Label tautan wajib diisi'),
  url: z.string().trim().url('Format URL tautan tidak valid (harus diawali http:// atau https://)'),
})

export type OtherLinkItem = z.infer<typeof otherLinkItemSchema>

// Helper validasi URL opsional: jika string kosong "", diizinkan dan diubah menjadi null
const optionalUrlSchema = (fieldName: string) =>
  z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val))
    .refine(
      (val) => {
        if (!val) return true
        try {
          const url = new URL(val)
          return url.protocol === 'http:' || url.protocol === 'https:'
        } catch {
          return false
        }
      },
      { message: `Format URL ${fieldName} tidak valid (harus diawali http:// atau https://)` }
    )

// Helper validasi email opsional
const optionalEmailSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((val) => (val === '' ? null : val))
  .refine(
    (val) => {
      if (!val) return true
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
    },
    { message: 'Format email tidak valid' }
  )

export const profileFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Nama lengkap wajib diisi')
    .max(100, 'Nama lengkap maksimal 100 karakter'),
  headline: z
    .string()
    .trim()
    .min(1, 'Headline wajib diisi')
    .max(150, 'Headline profesional maksimal 150 karakter'),
  summary: z
    .string()
    .trim()
    .max(3000, 'Ringkasan profil maksimal 3000 karakter')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  email: optionalEmailSchema,
  phone: z
    .string()
    .trim()
    .max(30, 'Nomor telepon maksimal 30 karakter')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  location: z
    .string()
    .trim()
    .max(100, 'Lokasi maksimal 100 karakter')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  linkedinUrl: optionalUrlSchema('LinkedIn'),
  githubUrl: optionalUrlSchema('GitHub'),
  otherLinks: z.array(otherLinkItemSchema).default([]),

  // Pengaturan visibilitas kontak (PROF-05)
  showEmail: z.boolean().default(false),
  showPhone: z.boolean().default(false),
  showLocation: z.boolean().default(true),
  showLinkedin: z.boolean().default(true),
  showGithub: z.boolean().default(true),
})

export type ProfileFormInput = z.infer<typeof profileFormSchema>

export interface ContactVisibilitySettings {
  showEmail: boolean
  showPhone: boolean
  showLocation: boolean
  showLinkedin: boolean
  showGithub: boolean
}

export interface VisibleContactsResult {
  email: string | null
  phone: string | null
  location: string | null
  linkedinUrl: string | null
  githubUrl: string | null
  otherLinks: OtherLinkItem[]
}

/**
 * Memfilter field kontak profil sesuai aturan visibilitas di PortfolioSettings (PROF-04, PROF-05).
 * Hanya field yang memiliki nilai dan izin visibilitas bernilai true yang dikembalikan.
 * Aturan AGENTS.md #10: Tidak menampilkan elemen kosong.
 */
export function filterVisibleContacts(
  profile: {
    email?: string | null
    phone?: string | null
    location?: string | null
    linkedinUrl?: string | null
    githubUrl?: string | null
    otherLinks?: unknown
  },
  settings: ContactVisibilitySettings
): VisibleContactsResult {
  const parseOtherLinks = (links: unknown): OtherLinkItem[] => {
    if (!Array.isArray(links)) return []
    return links.filter(
      (item): item is OtherLinkItem =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.label === 'string' &&
        item.label.trim() !== '' &&
        typeof item.url === 'string' &&
        item.url.trim() !== ''
    )
  }

  return {
    email: settings.showEmail && profile.email?.trim() ? profile.email.trim() : null,
    phone: settings.showPhone && profile.phone?.trim() ? profile.phone.trim() : null,
    location: settings.showLocation && profile.location?.trim() ? profile.location.trim() : null,
    linkedinUrl:
      settings.showLinkedin && profile.linkedinUrl?.trim() ? profile.linkedinUrl.trim() : null,
    githubUrl: settings.showGithub && profile.githubUrl?.trim() ? profile.githubUrl.trim() : null,
    otherLinks: parseOtherLinks(profile.otherLinks),
  }
}
