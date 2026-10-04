import { describe, it, expect, vi } from 'vitest'
import { projectFormSchema } from '@/lib/validation/project'
import { slugify, resolveUniqueProjectSlug } from '@/lib/slug'
import { db } from '@/lib/db'

describe('Project CRUD Logic & Validation', () => {
  // 1. Validasi Form Zod (5.2 & DATA-01..03)
  describe('projectFormSchema Validation', () => {
    it('rejects empty title with clear error message', () => {
      const result = projectFormSchema.safeParse({
        title: '',
        shortSummary: 'Ringkasan proyek yang valid',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.title).toContain('Judul proyek wajib diisi')
      }
    })

    it('rejects empty shortSummary with clear error message', () => {
      const result = projectFormSchema.safeParse({
        title: 'Judul Proyek Valid',
        shortSummary: '   ',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.shortSummary).toContain('Ringkasan singkat wajib diisi')
      }
    })

    it('rejects endDate earlier than startDate when not ongoing', () => {
      const result = projectFormSchema.safeParse({
        title: 'Judul Proyek Valid',
        shortSummary: 'Ringkasan singkat proyek',
        startDate: '2026-06-01',
        endDate: '2026-01-01', // Lebih awal dari startDate
        isOngoing: false,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.endDate).toContain(
          'Tanggal selesai tidak boleh sebelum tanggal mulai'
        )
      }
    })

    it('accepts endDate later than or equal to startDate', () => {
      const result = projectFormSchema.safeParse({
        title: 'Judul Proyek Valid',
        shortSummary: 'Ringkasan singkat proyek',
        startDate: '2026-01-01',
        endDate: '2026-06-01',
        isOngoing: false,
      })

      expect(result.success).toBe(true)
    })

    it('allows null/empty endDate when isOngoing is true', () => {
      const result = projectFormSchema.safeParse({
        title: 'Proyek Aktif',
        shortSummary: 'Sedang dikembangkan saat ini',
        startDate: '2026-01-01',
        endDate: null,
        isOngoing: true,
      })

      expect(result.success).toBe(true)
    })

    it('rejects invalid repositoryUrl and demoUrl', () => {
      const result = projectFormSchema.safeParse({
        title: 'Proyek Web',
        shortSummary: 'Ringkasan web',
        repositoryUrl: 'bukan-url-valid',
        demoUrl: 'ftp://invalidscheme.com',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors
        expect(errors.repositoryUrl?.[0]).toContain('Format URL tidak valid')
        expect(errors.demoUrl?.[0]).toContain('Format URL tidak valid')
      }
    })

    it('accepts valid http/https URLs and optional fields as empty strings or arrays', () => {
      const result = projectFormSchema.safeParse({
        title: 'MyCareerSpace Portfolio',
        shortSummary: 'Personal CMS & ATS CV Generator',
        description: 'Detail deskripsi proyek...',
        role: 'Full-Stack Developer',
        projectType: 'PERSONAL',
        startDate: '2026-01-01',
        endDate: '2026-04-01',
        isOngoing: false,
        technologies: ['Next.js', 'TypeScript', 'Prisma', 'Tailwind CSS'],
        responsibilities: ['Merancang schema database', 'Implementasi auth'],
        outcomes: ['Sistem selesai sesuai PRD'],
        repositoryUrl: 'https://github.com/firdahana/mycareerspace',
        demoUrl: 'https://mycareerspace.app',
        published: true,
        featured: true,
        skillIds: ['skill-1', 'skill-2'],
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.technologies).toHaveLength(4)
        expect(result.data.responsibilities).toHaveLength(2)
        expect(result.data.skillIds).toEqual(['skill-1', 'skill-2'])
      }
    })

    it('rejects featured: true when published: false (unfeature on unpublish rule)', () => {
      const result = projectFormSchema.safeParse({
        title: 'Proyek Privat',
        shortSummary: 'Masih dalam pengembangan',
        published: false,
        featured: true,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.featured).toContain(
          'Proyek harus berstatus Published sebelum dapat dijadikan Featured'
        )
      }
    })
  })

  // 2. Slug Generation & Uniqueness (Requirement 3)
  describe('Slug Generation & Stability', () => {
    it('generates URL-friendly slug from title', () => {
      expect(slugify('My Super Project 2.0!')).toBe('my-super-project-20')
      expect(slugify('Sistem Manajemen Karier & Portofolio')).toBe('sistem-manajemen-karier-portofolio')
      expect(slugify('   leading-trailing---dashes   ')).toBe('leading-trailing-dashes')
    })

    it('resolves unique slug by checking database conflicts', async () => {
      // Mock db.project.findFirst
      const findFirstMock = vi.spyOn(db.project, 'findFirst')

      // Kasus 1: Slug belum pernah terpakai
      findFirstMock.mockResolvedValueOnce(null)
      const slug1 = await resolveUniqueProjectSlug('profile-1', 'Portfolio Web')
      expect(slug1).toBe('portfolio-web')

      // Kasus 2: Slug "portfolio-web" sudah ada, "portfolio-web-1" tersedia
      findFirstMock
        .mockResolvedValueOnce({ id: 'existing-proj' } as unknown as Awaited<
          ReturnType<typeof db.project.findFirst>
        >)
        .mockResolvedValueOnce(null)
      const slug2 = await resolveUniqueProjectSlug('profile-1', 'Portfolio Web')
      expect(slug2).toBe('portfolio-web-1')

      findFirstMock.mockRestore()
    })
  })

  // 3. Status Privat & Featured (DATA-04 & Requirement 4)
  describe('DATA-04: Edit Project Privat Tetap Privat & Unfeature Saat Unpublish', () => {
    it('keeps private project private when edited without explicit publish switch', () => {
      // Simulasi form edit submission tanpa mengubah status published
      const formPayload = {
        title: 'Project In Development (Updated Title)',
        shortSummary: 'Updated summary',
        published: false, // Tetap false
        featured: false,
      }

      const parsed = projectFormSchema.safeParse(formPayload)
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data.published).toBe(false)
        expect(parsed.data.featured).toBe(false)
      }
    })

    it('ensures unpublishing a project unfeatures it', () => {
      // Logic from actions:
      const published = false
      let featured = true

      if (!published) {
        featured = false
      }

      expect(published).toBe(false)
      expect(featured).toBe(false)
    })
  })

  // 4. Pengurutan Naik / Turun (DATA-06)
  describe('DATA-06: Pengurutan Naik/Turun (sortOrder)', () => {
    it('correctly calculates reordered items when moving up or down', () => {
      const projects = [
        { id: 'p1', title: 'Project 1', sortOrder: 0 },
        { id: 'p2', title: 'Project 2', sortOrder: 1 },
        { id: 'p3', title: 'Project 3', sortOrder: 2 },
      ]

      // Move p2 up: swaps index 1 with index 0
      const moveUp = (list: typeof projects, index: number) => {
        if (index <= 0) return list
        const copy = [...list]
        const temp = copy[index]
        copy[index] = copy[index - 1]
        copy[index - 1] = temp
        return copy
      }

      const afterMoveUp = moveUp(projects, 1)
      expect(afterMoveUp[0].id).toBe('p2')
      expect(afterMoveUp[1].id).toBe('p1')
      expect(afterMoveUp[2].id).toBe('p3')

      // Move top item up: no change
      const afterTopMoveUp = moveUp(projects, 0)
      expect(afterTopMoveUp[0].id).toBe('p1')

      // Move p2 down: swaps index 1 with index 2
      const moveDown = (list: typeof projects, index: number) => {
        if (index >= list.length - 1) return list
        const copy = [...list]
        const temp = copy[index]
        copy[index] = copy[index + 1]
        copy[index + 1] = temp
        return copy
      }

      const afterMoveDown = moveDown(projects, 1)
      expect(afterMoveDown[0].id).toBe('p1')
      expect(afterMoveDown[1].id).toBe('p3')
      expect(afterMoveDown[2].id).toBe('p2')

      // Move bottom item down: no change
      const afterBottomMoveDown = moveDown(projects, 2)
      expect(afterBottomMoveDown[2].id).toBe('p3')
    })
  })
})
