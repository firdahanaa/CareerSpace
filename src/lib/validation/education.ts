import { z } from 'zod'

const optionalString = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((val) => (val === '' || val === undefined ? null : val))

export const educationFormSchema = z
  .object({
    institution: z
      .string()
      .trim()
      .min(1, 'Nama institusi atau universitas wajib diisi')
      .max(150, 'Nama institusi maksimal 150 karakter'),
    degree: optionalString,
    fieldOfStudy: optionalString,
    startDate: optionalString,
    endDate: optionalString,
    isCurrent: z.boolean().default(false),
    gpa: optionalString,
    description: optionalString,
    published: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    // Validasi urutan tanggal jika tidak sedang menempuh studi dan kedua tanggal diisi
    if (!data.isCurrent && data.startDate && data.endDate) {
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end < start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tanggal selesai atau kelulusan tidak boleh sebelum tanggal mulai',
          path: ['endDate'],
        })
      }
    }
  })

export type EducationFormData = z.infer<typeof educationFormSchema>
