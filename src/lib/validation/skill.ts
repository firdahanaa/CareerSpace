import { z } from 'zod'

export const skillCategories = [
  'TECHNICAL',
  'ANALYTICAL',
  'BUSINESS',
  'INTERPERSONAL',
  'LANGUAGE',
  'OTHER',
] as const

export type SkillCategoryValue = (typeof skillCategories)[number]

export const SKILL_CATEGORY_LABELS: Record<SkillCategoryValue, string> = {
  TECHNICAL: 'Teknis (Technical)',
  ANALYTICAL: 'Analitis (Analytical)',
  BUSINESS: 'Bisnis & Manajemen (Business)',
  INTERPERSONAL: 'Interpersonal & Komunikasi',
  LANGUAGE: 'Bahasa (Language)',
  OTHER: 'Lainnya (Other)',
}

export const proficiencyLevels = [
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
  'EXPERT',
] as const

export type ProficiencyLevelValue = (typeof proficiencyLevels)[number]

export const PROFICIENCY_LEVEL_LABELS: Record<ProficiencyLevelValue, string> = {
  BEGINNER: 'Pemula (Beginner)',
  INTERMEDIATE: 'Menengah (Intermediate)',
  ADVANCED: 'Mahir (Advanced)',
  EXPERT: 'Ahli (Expert)',
}

export const skillFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama skill wajib diisi')
    .max(50, 'Nama skill maksimal 50 karakter'),
  category: z.enum(skillCategories, {
    error: 'Kategori skill wajib dipilih',
  }),
  proficiency: z
    .enum(proficiencyLevels)
    .or(z.literal(''))
    .optional()
    .nullable()
    .transform((val) => (val ? val : null)),
  published: z.boolean().default(false),
})

export type SkillFormData = z.infer<typeof skillFormSchema>
