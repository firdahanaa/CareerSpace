import { describe, it, expect } from 'vitest'
import { educationFormSchema } from '@/lib/validation/education'

describe('Education CRUD Logic & Validation (PRD 5.4)', () => {
  // 1. Validasi Field Wajib
  describe('Validasi Field Wajib (educationFormSchema)', () => {
    it('rejects empty institution with descriptive error message', () => {
      const result = educationFormSchema.safeParse({
        institution: '   ',
        degree: 'Sarjana Komputer',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.institution).toContain(
          'Nama institusi atau universitas wajib diisi'
        )
      }
    })

    it('rejects institution exceeding 150 characters', () => {
      const result = educationFormSchema.safeParse({
        institution: 'A'.repeat(151),
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.institution).toContain(
          'Nama institusi maksimal 150 karakter'
        )
      }
    })

    it('accepts valid required institution and applies defaults', () => {
      const result = educationFormSchema.safeParse({
        institution: 'Institut Teknologi Bandung',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.institution).toBe('Institut Teknologi Bandung')
        expect(result.data.isCurrent).toBe(false)
        expect(result.data.published).toBe(false)
        expect(result.data.degree).toBeNull()
        expect(result.data.fieldOfStudy).toBeNull()
        expect(result.data.gpa).toBeNull()
        expect(result.data.description).toBeNull()
      }
    })
  })

  // 2. Field Opsional
  describe('Field Opsional (PRD 5.4)', () => {
    it('transforms empty strings to null for optional fields', () => {
      const result = educationFormSchema.safeParse({
        institution: 'Universitas Indonesia',
        degree: '',
        fieldOfStudy: '   ',
        startDate: '',
        endDate: '',
        gpa: '',
        description: '',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.degree).toBeNull()
        expect(result.data.fieldOfStudy).toBeNull()
        expect(result.data.startDate).toBeNull()
        expect(result.data.endDate).toBeNull()
        expect(result.data.gpa).toBeNull()
        expect(result.data.description).toBeNull()
      }
    })

    it('accepts free-text GPA format', () => {
      const validGpaExamples = [
        '3.85 / 4.00',
        'Cum Laude',
        'First Class Honours',
        '3.92',
        'Grade A',
      ]

      for (const gpa of validGpaExamples) {
        const result = educationFormSchema.safeParse({
          institution: 'Universitas Gadjah Mada',
          gpa,
        })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.gpa).toBe(gpa)
        }
      }
    })
  })

  // 3. Validasi Tanggal & isCurrent
  describe('isCurrent and Date Range Validation', () => {
    it('allows endDate to be empty when isCurrent is true', () => {
      const result = educationFormSchema.safeParse({
        institution: 'Universitas Indonesia',
        startDate: '2023-08-01',
        endDate: '',
        isCurrent: true,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isCurrent).toBe(true)
        expect(result.data.endDate).toBeNull()
      }
    })

    it('rejects endDate earlier than startDate when isCurrent is false', () => {
      const result = educationFormSchema.safeParse({
        institution: 'Institut Teknologi Bandung',
        startDate: '2024-09-01',
        endDate: '2020-07-01',
        isCurrent: false,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.endDate).toContain(
          'Tanggal selesai atau kelulusan tidak boleh sebelum tanggal mulai'
        )
      }
    })

    it('accepts valid chronological dates when endDate >= startDate', () => {
      const result = educationFormSchema.safeParse({
        institution: 'Universitas Indonesia',
        startDate: '2020-08-15',
        endDate: '2024-07-20',
        isCurrent: false,
      })

      expect(result.success).toBe(true)
    })

    it('allows only startDate or only expected graduation endDate', () => {
      const onlyStart = educationFormSchema.safeParse({
        institution: 'UI',
        startDate: '2022-09-01',
      })
      expect(onlyStart.success).toBe(true)

      const onlyEnd = educationFormSchema.safeParse({
        institution: 'UI',
        endDate: '2026-06-30',
        isCurrent: false,
      })
      expect(onlyEnd.success).toBe(true)
    })
  })
})
