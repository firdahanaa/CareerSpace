import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { db } from '../src/lib/db'
import { Prisma } from '@prisma/client'

const hasDb = !!process.env.DATABASE_URL

describe.skipIf(!hasDb)('Database Schema Constraints & Relations', () => {
  let adminId: string
  let profileId: string
  let cvId: string
  let projectId: string
  let experienceId: string

  beforeAll(async () => {
    // Check database connection before running tests
    try {
      await db.$connect()
    } catch {
      console.warn('⚠️ Database not accessible; skipping schema constraint tests if offline')
    }
  })

  afterAll(async () => {
    try {
      // Clean up in reverse dependency order
      if (cvId) {
        await db.cvRecordSelection.deleteMany({ where: { cvId } })
        await db.cvConfig.deleteMany({ where: { id: cvId } })
      }
      if (projectId) {
        await db.project.deleteMany({ where: { id: projectId } })
      }
      if (experienceId) {
        await db.experience.deleteMany({ where: { id: experienceId } })
      }
      if (profileId) {
        await db.profile.deleteMany({ where: { id: profileId } })
      }
      if (adminId) {
        await db.administrator.deleteMany({ where: { id: adminId } })
      }
    } catch (e) {
      console.error('Error cleaning up test data:', e)
    } finally {
      await db.$disconnect()
    }
  })

  beforeEach(async () => {
    // Clean any selections created during tests
    if (cvId) {
      await db.cvRecordSelection.deleteMany({ where: { cvId } })
    }

    // Ensure baseline test fixtures exist
    if (!adminId) {
      const admin = await db.administrator.create({
        data: {
          email: `test-admin-${Date.now()}@test.local`,
          passwordHash: 'dummy-hash',
        },
      })
      adminId = admin.id

      const profile = await db.profile.create({
        data: {
          administratorId: adminId,
          fullName: 'Test User',
          headline: 'Tester',
        },
      })
      profileId = profile.id

      const cv = await db.cvConfig.create({
        data: {
          profileId,
          name: 'Target Role CV',
          targetRole: 'Software Engineer',
        },
      })
      cvId = cv.id

      const project = await db.project.create({
        data: {
          profileId,
          slug: `test-project-${Date.now()}`,
          title: 'Constraint Test Project',
          shortSummary: 'Summary for constraint testing',
        },
      })
      projectId = project.id

      const exp = await db.experience.create({
        data: {
          profileId,
          organization: 'Test Org',
          position: 'Test Position',
          category: 'EMPLOYMENT',
        },
      })
      experienceId = exp.id
    }
  })

  // (a) CHECK constraint "tepat satu FK terisi"
  describe('CHECK Constraint: cv_selection_exactly_one_record', () => {
    it('rejects CvRecordSelection with 0 FKs (all null)', async () => {
      await expect(
        db.cvRecordSelection.create({
          data: {
            cvId,
            projectId: null,
            experienceId: null,
            educationId: null,
            skillId: null,
            certificationId: null,
          },
        })
      ).rejects.toThrow()
    })

    it('rejects CvRecordSelection with 2 FKs simultaneously', async () => {
      await expect(
        db.cvRecordSelection.create({
          data: {
            cvId,
            projectId,
            experienceId,
          },
        })
      ).rejects.toThrow()
    })

    it('accepts CvRecordSelection with exactly 1 FK', async () => {
      const selection = await db.cvRecordSelection.create({
        data: {
          cvId,
          projectId,
        },
      })

      expect(selection).toBeDefined()
      expect(selection.projectId).toBe(projectId)
      expect(selection.experienceId).toBeNull()
    })
  })

  // (b) onDelete: Restrict on Project referenced by CV
  describe('Referential Integrity (onDelete: Restrict)', () => {
    it('prevents deleting a Project that is currently referenced by a CvRecordSelection', async () => {
      // Link project to CV
      await db.cvRecordSelection.create({
        data: {
          cvId,
          projectId,
        },
      })

      // Attempt to delete project -> MUST be rejected due to onDelete: Restrict
      await expect(
        db.project.delete({
          where: { id: projectId },
        })
      ).rejects.toThrowError(Prisma.PrismaClientKnownRequestError)
    })
  })

  // (c) Unique constraint: @@unique([cvId, projectId])
  describe('Unique Constraint: @@unique([cvId, projectId])', () => {
    it('prevents duplicate project reference within the same CV', async () => {
      // First insertion succeeds
      await db.cvRecordSelection.create({
        data: {
          cvId,
          projectId,
        },
      })

      // Second insertion with identical (cvId, projectId) MUST fail
      await expect(
        db.cvRecordSelection.create({
          data: {
            cvId,
            projectId,
          },
        })
      ).rejects.toThrowError(Prisma.PrismaClientKnownRequestError)
    })
  })
})
