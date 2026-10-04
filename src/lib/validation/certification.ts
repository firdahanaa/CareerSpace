import { z } from 'zod'

const optionalString = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((val) => (val === '' || val === undefined ? null : val))

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((val) => (val === '' || val === undefined ? null : val))
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
    { message: 'Format URL sertifikat tidak valid (harus diawali http:// atau https://)' }
  )

export const certificationFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Judul sertifikasi atau pencapaian wajib diisi')
      .max(150, 'Judul sertifikasi maksimal 150 karakter'),
    issuer: optionalString,
    issueDate: optionalString,
    expirationDate: optionalString,
    credentialId: optionalString,
    credentialUrl: optionalUrl,
    description: optionalString,
    published: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    // Validasi urutan tanggal jika kedua tanggal diisi
    if (data.issueDate && data.expirationDate) {
      const issue = new Date(data.issueDate)
      const expiry = new Date(data.expirationDate)
      if (!isNaN(issue.getTime()) && !isNaN(expiry.getTime()) && expiry < issue) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tanggal kedaluwarsa tidak boleh sebelum tanggal penerbitan',
          path: ['expirationDate'],
        })
      }
    }
  })

export type CertificationFormData = z.infer<typeof certificationFormSchema>

/**
 * Menentukan apakah sertifikasi telah kedaluwarsa berdasarkan tanggal hari ini.
 */
export function isCertificationExpired(expirationDate?: Date | string | null): boolean {
  if (!expirationDate) return false
  const expiry = new Date(expirationDate)
  if (isNaN(expiry.getTime())) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return expiry < today
}
