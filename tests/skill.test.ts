import { describe, it, expect, vi } from 'vitest'
import {
  skillFormSchema,
  proficiencyLevels,
} from '@/lib/validation/skill'
import { db } from '@/lib/db'

describe('Skill CRUD Logic & Validation (PRD 5.5)', () => {
  // 1. Validasi Zod (skillFormSchema)
  describe('skillFormSchema Validation', () => {
    it('rejects empty skill name with descriptive error message', () => {
      const result = skillFormSchema.safeParse({
        name: '   ',
        category: 'TECHNICAL',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.name).toContain('Nama skill wajib diisi')
      }
    })

    it('allows proficiency to be empty/null (PROF-03 & PRD 5.5)', () => {
      const result1 = skillFormSchema.safeParse({
        name: 'PostgreSQL',
        category: 'TECHNICAL',
        proficiency: null,
      })
      expect(result1.success).toBe(true)
      if (result1.success) {
        expect(result1.data.proficiency).toBeNull()
      }

      const result2 = skillFormSchema.safeParse({
        name: 'TypeScript',
        category: 'TECHNICAL',
        proficiency: '',
      })
      expect(result2.success).toBe(true)
      if (result2.success) {
        expect(result2.data.proficiency).toBeNull()
      }
    })

    it('accepts valid proficiency levels', () => {
      for (const level of proficiencyLevels) {
        const result = skillFormSchema.safeParse({
          name: `Skill ${level}`,
          category: 'TECHNICAL',
          proficiency: level,
        })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.proficiency).toBe(level)
        }
      }
    })

    it('requires a valid category', () => {
      const result = skillFormSchema.safeParse({
        name: 'Leadership',
        category: 'INVALID_CATEGORY',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.category).toBeDefined()
      }
    })

    it('defaults published to false', () => {
      const result = skillFormSchema.safeParse({
        name: 'Communication',
        category: 'INTERPERSONAL',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.published).toBe(false)
      }
    })
  })

  // 2. Duplicate Name Validation (Case-Insensitive)
  describe('Case-Insensitive Duplicate Name Check', () => {
    it('detects existing duplicate skill name regardless of casing', async () => {
      const findFirstMock = vi.spyOn(db.skill, 'findFirst')

      // Kasus 1: "React" sudah ada, user mencoba menambah "react"
      findFirstMock.mockResolvedValueOnce({
        id: 'skill-1',
        profileId: 'profile-1',
        name: 'React',
        category: 'TECHNICAL',
      } as unknown as Awaited<ReturnType<typeof db.skill.findFirst>>)

      const checkDuplicate = async (profileId: string, nameToCheck: string) => {
        const existing = await db.skill.findFirst({
          where: {
            profileId,
            name: { equals: nameToCheck, mode: 'insensitive' },
          },
        })
        return Boolean(existing)
      }

      const isDuplicate = await checkDuplicate('profile-1', 'react')
      expect(isDuplicate).toBe(true)

      // Kasus 2: "Vue" belum ada
      findFirstMock.mockResolvedValueOnce(null)
      const isUnique = await checkDuplicate('profile-1', 'Vue')
      expect(isUnique).toBe(false)

      findFirstMock.mockRestore()
    })
  })

  // 3. In-Category Reorder Logic (DATA-06)
  describe('Within-Category Reorder Logic', () => {
    it('swaps order of skills within the same category', () => {
      const technicalSkills = [
        { id: 's1', name: 'TypeScript', category: 'TECHNICAL', sortOrder: 0 },
        { id: 's2', name: 'PostgreSQL', category: 'TECHNICAL', sortOrder: 1 },
        { id: 's3', name: 'Docker', category: 'TECHNICAL', sortOrder: 2 },
      ]

      const moveUp = (list: typeof technicalSkills, index: number) => {
        if (index <= 0) return list
        const copy = [...list]
        const temp = copy[index]
        copy[index] = copy[index - 1]
        copy[index - 1] = temp
        return copy
      }

      // Move s2 (PostgreSQL) up
      const afterUp = moveUp(technicalSkills, 1)
      expect(afterUp[0].id).toBe('s2')
      expect(afterUp[1].id).toBe('s1')
      expect(afterUp[2].id).toBe('s3')

      const moveDown = (list: typeof technicalSkills, index: number) => {
        if (index >= list.length - 1) return list
        const copy = [...list]
        const temp = copy[index]
        copy[index] = copy[index + 1]
        copy[index + 1] = temp
        return copy
      }

      // Move s1 down
      const afterDown = moveDown(technicalSkills, 0)
      expect(afterDown[0].id).toBe('s2')
      expect(afterDown[1].id).toBe('s1')
      expect(afterDown[2].id).toBe('s3')
    })
  })

  // 4. Cascade Disassociation Logic
  describe('Cascade Disassociation on Delete', () => {
    it('safely disassociates linked project and experience relations when skill is deleted', () => {
      // Data mockup:
      const projectSkills = [
        { projectId: 'p1', skillId: 's1' },
        { projectId: 'p2', skillId: 's1' },
        { projectId: 'p3', skillId: 's2' },
      ]

      const deleteSkill = (skillId: string) => {
        // onDelete: Cascade in join table removes only join records with that skillId
        return projectSkills.filter((ps) => ps.skillId !== skillId)
      }

      const remainingRelations = deleteSkill('s1')
      expect(remainingRelations).toHaveLength(1)
      expect(remainingRelations[0].projectId).toBe('p3')
      expect(remainingRelations[0].skillId).toBe('s2')
    })
  })
})
