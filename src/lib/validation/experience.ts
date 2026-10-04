import { z } from 'zod'

export const experienceCategories = [
  'EMPLOYMENT',
  'INTERNSHIP',
  'ORGANIZATION',
  'VOLUNTEERING',
  'FREELANCE',
] as const

export type ExperienceCategoryValue = (typeof experienceCategories)[number]

export const EXPERIENCE_CATEGORY_LABELS: Record<ExperienceCategoryValue, string> = {
  EMPLOYMENT: 'Pekerjaan (Employment)',
  INTERNSHIP: 'Magang (Internship)',
  ORGANIZATION: 'Organisasi (Organization)',
  VOLUNTEERING: 'Sukarelawan (Volunteering)',
  FREELANCE: 'Freelance / Kontrak',
}

const optionalString = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((val) => (val === '' ? null : val))

export const experienceFormSchema = z
  .object({
    organization: z
      .string()
      .trim()
      .min(1, 'Nama organisasi atau perusahaan wajib diisi')
      .max(120, 'Nama organisasi maksimal 120 karakter'),
    position: z
      .string()
      .trim()
      .min(1, 'Posisi atau peran wajib diisi')
      .max(120, 'Posisi atau peran maksimal 120 karakter'),
    category: z.enum(experienceCategories, {
      error: 'Kategori pengalaman wajib dipilih',
    }),
    location: optionalString,
    startDate: optionalString,
    endDate: optionalString,
    isCurrent: z.boolean().default(false),
    description: optionalString,
    responsibilities: z
      .array(z.string().trim().min(1))
      .default([]),
    achievements: z
      .array(z.string().trim().min(1))
      .default([]),
    published: z.boolean().default(false),
    skillIds: z.array(z.string()).default([]),
  })
  .superRefine((data, ctx) => {
    // Validasi urutan tanggal jika tidak sedang aktif dan kedua tanggal diisi
    if (!data.isCurrent && data.startDate && data.endDate) {
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
  })

export type ExperienceFormData = z.infer<typeof experienceFormSchema>
