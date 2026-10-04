import { describe, it, expect } from 'vitest'
import {
  experienceFormSchema,
  experienceCategories,
} from '@/lib/validation/experience'

describe('Experience CRUD Logic & Validation (PRD 5.3)', () => {
  // 1. Validasi Wajib
  describe('Validasi Field Wajib (experienceFormSchema)', () => {
    it('rejects empty organization with descriptive error message', () => {
      const result = experienceFormSchema.safeParse({
        organization: '   ',
        position: 'Software Engineer',
        category: 'EMPLOYMENT',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.organization).toContain(
          'Nama organisasi atau perusahaan wajib diisi'
        )
      }
    })

    it('rejects empty position with descriptive error message', () => {
      const result = experienceFormSchema.safeParse({
        organization: 'Google',
        position: '',
        category: 'EMPLOYMENT',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.position).toContain(
          'Posisi atau peran wajib diisi'
        )
      }
    })

    it('rejects invalid category', () => {
      const result = experienceFormSchema.safeParse({
        organization: 'Google',
        position: 'Engineer',
        category: 'UNKNOWN_CATEGORY',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.category).toBeDefined()
      }
    })

    it('accepts all valid experience categories from PRD 5.3', () => {
      for (const cat of experienceCategories) {
        const result = experienceFormSchema.safeParse({
          organization: 'Test Org',
          position: 'Test Role',
          category: cat,
        })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.category).toBe(cat)
        }
      }
    })
  })

  // 2. Logika isCurrent & Urutan Tanggal
  describe('isCurrent and Date Range Validation', () => {
    it('allows endDate to be empty/null when isCurrent is true', () => {
      const result = experienceFormSchema.safeParse({
        organization: 'PT Teknologi Bangsa',
        position: 'Frontend Lead',
        category: 'EMPLOYMENT',
        startDate: '2024-01-01',
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
      const result = experienceFormSchema.safeParse({
        organization: 'Tech Corp',
        position: 'Intern',
        category: 'INTERNSHIP',
        startDate: '2025-06-01',
        endDate: '2025-01-01',
        isCurrent: false,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.endDate).toContain(
          'Tanggal selesai tidak boleh sebelum tanggal mulai'
        )
      }
    })

    it('accepts endDate equal to or after startDate when isCurrent is false', () => {
      const result = experienceFormSchema.safeParse({
        organization: 'Tech Corp',
        position: 'Intern',
        category: 'INTERNSHIP',
        startDate: '2025-01-01',
        endDate: '2025-06-01',
        isCurrent: false,
      })

      expect(result.success).toBe(true)
    })

    it('accepts valid full payload with responsibilities, achievements, and skills', () => {
      const result = experienceFormSchema.safeParse({
        organization: 'Open Source Community',
        position: 'Core Contributor',
        category: 'VOLUNTEERING',
        location: 'Remote',
        startDate: '2023-01-01',
        endDate: '2024-01-01',
        isCurrent: false,
        description: 'Berkontribusi pada proyek open source',
        responsibilities: ['Review pull request', 'Tulis dokumentasi'],
        achievements: ['Mendapat penghargaan top contributor'],
        skillIds: ['skill-1', 'skill-2'],
        published: true,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.responsibilities).toHaveLength(2)
        expect(result.data.achievements).toHaveLength(1)
        expect(result.data.skillIds).toHaveLength(2)
        expect(result.data.published).toBe(true)
      }
    })
  })

  // 3. Filter Kategori
  describe('Category Filtering Logic', () => {
    const sampleExperiences = [
      { id: '1', organization: 'Company A', category: 'EMPLOYMENT' },
      { id: '2', organization: 'Company B', category: 'INTERNSHIP' },
      { id: '3', organization: 'Student Club', category: 'ORGANIZATION' },
      { id: '4', organization: 'NGO', category: 'VOLUNTEERING' },
      { id: '5', organization: 'Client X', category: 'FREELANCE' },
    ]

    const filterExperiences = (category: string) => {
      if (category === 'ALL') return sampleExperiences
      return sampleExperiences.filter((item) => item.category === category)
    }

    it('returns all experiences when filter is ALL', () => {
      const all = filterExperiences('ALL')
      expect(all).toHaveLength(5)
    })

    it('returns only employment experiences when filter is EMPLOYMENT', () => {
      const employment = filterExperiences('EMPLOYMENT')
      expect(employment).toHaveLength(1)
      expect(employment[0].organization).toBe('Company A')
    })

    it('returns only internship experiences when filter is INTERNSHIP', () => {
      const internship = filterExperiences('INTERNSHIP')
      expect(internship).toHaveLength(1)
      expect(internship[0].organization).toBe('Company B')
    })

    it('returns only organization experiences when filter is ORGANIZATION', () => {
      const org = filterExperiences('ORGANIZATION')
      expect(org).toHaveLength(1)
      expect(org[0].organization).toBe('Student Club')
    })

    it('returns only volunteering experiences when filter is VOLUNTEERING', () => {
      const vol = filterExperiences('VOLUNTEERING')
      expect(vol).toHaveLength(1)
      expect(vol[0].organization).toBe('NGO')
    })

    it('returns only freelance experiences when filter is FREELANCE', () => {
      const freelance = filterExperiences('FREELANCE')
      expect(freelance).toHaveLength(1)
      expect(freelance[0].organization).toBe('Client X')
    })
  })

  // 4. Reorder Up / Down Logic (DATA-06)
  describe('Experience Reorder Logic (DATA-06)', () => {
    it('swaps sort order between adjacent experiences correctly', () => {
      const experiences = [
        { id: 'e1', organization: 'Org 1', sortOrder: 0 },
        { id: 'e2', organization: 'Org 2', sortOrder: 1 },
        { id: 'e3', organization: 'Org 3', sortOrder: 2 },
      ]

      const moveUp = (list: typeof experiences, index: number) => {
        if (index <= 0) return list
        const copy = [...list]
        const temp = copy[index]
        copy[index] = copy[index - 1]
        copy[index - 1] = temp
        return copy
      }

      const movedUp = moveUp(experiences, 1)
      expect(movedUp[0].id).toBe('e2')
      expect(movedUp[1].id).toBe('e1')
      expect(movedUp[2].id).toBe('e3')
    })
  })
})
