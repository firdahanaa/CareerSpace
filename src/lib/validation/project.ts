import { z } from 'zod'

export const projectTypes = [
  'ACADEMIC',
  'PERSONAL',
  'FREELANCE',
  'ORGANIZATIONAL',
  'PROFESSIONAL',
  'OTHER',
] as const

export type ProjectTypeValue = (typeof projectTypes)[number]

export const PROJECT_TYPE_LABELS: Record<ProjectTypeValue, string> = {
  PERSONAL: 'Pribadi (Personal)',
  PROFESSIONAL: 'Profesional (Kerja)',
  FREELANCE: 'Freelance',
  ORGANIZATIONAL: 'Organisasi',
  ACADEMIC: 'Akademik / Kuliah',
  OTHER: 'Lainnya',
}

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((val) => (val === '' ? null : val))
  .refine(
    (val) => {
      if (!val) return true
      try {
        const parsed = new URL(val)
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      } catch {
        return false
      }
    },
    { message: 'Format URL tidak valid (harus diawali http:// atau https://)' }
  )

const optionalString = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((val) => (val === '' ? null : val))

export const projectFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Judul proyek wajib diisi')
      .max(150, 'Judul proyek maksimal 150 karakter'),
    shortSummary: z
      .string()
      .trim()
      .min(1, 'Ringkasan singkat wajib diisi')
      .max(300, 'Ringkasan singkat maksimal 300 karakter'),
    slug: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform((val) => (val === '' ? null : val)),
    description: optionalString,
    role: optionalString,
    projectType: z
      .enum(projectTypes)
      .optional()
      .nullable()
      .transform((val) => (val ? val : null)),
    startDate: optionalString,
    endDate: optionalString,
    isOngoing: z.boolean().default(false),
    technologies: z
      .array(z.string().trim().min(1))
      .default([]),
    responsibilities: z
      .array(z.string().trim().min(1))
      .default([]),
    outcomes: z
      .array(z.string().trim().min(1))
      .default([]),
    repositoryUrl: optionalUrl,
    demoUrl: optionalUrl,
    coverImageUrl: optionalString,
    featured: z.boolean().default(false),
    published: z.boolean().default(false),
    skillIds: z.array(z.string()).default([]),
  })
  .superRefine((data, ctx) => {
    // 1. Validasi tanggal: jika tidak ongoing dan ada start & end date, endDate tidak boleh sebelum startDate
    if (!data.isOngoing && data.startDate && data.endDate) {
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end < start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tanggal selesai tidak boleh sebelum tanggal mulai',
          path: ['endDate'],
        })
      }
    }

    // 2. Jika published false, featured tidak boleh true (unfeature saat unpublish)
    if (!data.published && data.featured) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Proyek harus berstatus Published sebelum dapat dijadikan Featured',
        path: ['featured'],
      })
    }
  })

export type ProjectFormData = z.infer<typeof projectFormSchema>
