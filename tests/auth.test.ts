import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loginSchema } from '@/lib/validation/auth'
import { authConfig } from '@/lib/auth.config'
import { checkRateLimit, recordFailedAttempt, resetRateLimit, clearRateLimitStore } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'

// Mock Prisma db
vi.mock('@/lib/db', () => ({
  db: {
    administrator: {
      findUnique: vi.fn(),
    },
  },
}))

// Import after mocking db
import { db } from '@/lib/db'
import { verifyAdminCredentials } from '@/lib/auth'

describe('Authentication & Authorization Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearRateLimitStore()
  })

  // 1. Valid & Invalid Inputs with Zod Validation
  describe('Zod Validation (AUTH-02)', () => {
    it('validates correct email and password format', () => {
      const result = loginSchema.safeParse({
        email: 'admin@mycareerspace.local',
        password: 'ValidPassword123!',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid email formats', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'SomePassword',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Format email tidak valid')
      }
    })

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'admin@example.com',
        password: '',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Password wajib diisi')
      }
    })
  })

  // 2. Login Valid & Invalid Verification against Administrator table
  describe('Credentials Verification (AUTH-01, AUTH-02)', () => {
    it('succeeds for valid administrator credentials', async () => {
      const rawPassword = 'CorrectPassword123!'
      const hash = await bcrypt.hash(rawPassword, 10)

      vi.mocked(db.administrator.findUnique).mockResolvedValueOnce({
        id: 'admin-1',
        email: 'admin@mycareerspace.local',
        passwordHash: hash,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const admin = await verifyAdminCredentials('admin@mycareerspace.local', rawPassword)
      expect(admin).not.toBeNull()
      expect(admin?.id).toBe('admin-1')
      expect(admin?.email).toBe('admin@mycareerspace.local')
    })

    it('fails when email does not exist (returns null without leaking)', async () => {
      vi.mocked(db.administrator.findUnique).mockResolvedValueOnce(null)

      const result = await verifyAdminCredentials('nonexistent@example.com', 'AnyPassword')
      expect(result).toBeNull()
    })

    it('fails when password does not match passwordHash', async () => {
      const hash = await bcrypt.hash('CorrectPassword123!', 10)

      vi.mocked(db.administrator.findUnique).mockResolvedValueOnce({
        id: 'admin-1',
        email: 'admin@mycareerspace.local',
        passwordHash: hash,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await verifyAdminCredentials('admin@mycareerspace.local', 'WrongPassword!')
      expect(result).toBeNull()
    })
  })

  // 3. Rate Limiting Brute Force Protection
  describe('Brute Force Rate Limiting', () => {
    const key = 'login:test@example.com'

    it('allows initial login attempts and decrements remaining count', () => {
      expect(checkRateLimit(key, 3).allowed).toBe(true)
      expect(checkRateLimit(key, 3).remaining).toBe(3)

      recordFailedAttempt(key)
      expect(checkRateLimit(key, 3).allowed).toBe(true)
      expect(checkRateLimit(key, 3).remaining).toBe(2)
    })

    it('blocks access when rate limit is exceeded', () => {
      const limit = 3
      for (let i = 0; i < limit; i++) {
        recordFailedAttempt(key)
      }

      const status = checkRateLimit(key, limit)
      expect(status.allowed).toBe(false)
      expect(status.remaining).toBe(0)
      expect(status.retryAfterSeconds).toBeGreaterThan(0)
    })

    it('resets rate limit on successful reset', () => {
      recordFailedAttempt(key)
      recordFailedAttempt(key)
      resetRateLimit(key)

      const status = checkRateLimit(key, 3)
      expect(status.allowed).toBe(true)
      expect(status.remaining).toBe(3)
    })
  })

  // 4. Access Protection: authorized callback & requireAdmin (AUTH-03, AUTH-04)
  describe('Route Protection & Session Verification (AUTH-03, AUTH-04)', () => {
    const authorized = authConfig.callbacks?.authorized

    it('blocks access to /dashboard when user is not authenticated', () => {
      if (typeof authorized !== 'function') throw new Error('authorized callback not found')

      const result = authorized({
        auth: null,
        request: {
          nextUrl: new URL('http://localhost:3000/dashboard'),
        } as never,
      })

      expect(result).toBe(false)
    })

    it('blocks access to /dashboard/projects when user is not authenticated', () => {
      if (typeof authorized !== 'function') throw new Error('authorized callback not found')

      const result = authorized({
        auth: null,
        request: {
          nextUrl: new URL('http://localhost:3000/dashboard/projects'),
        } as never,
      })

      expect(result).toBe(false)
    })

    it('blocks access to /api/admin/projects when user is not authenticated', () => {
      if (typeof authorized !== 'function') throw new Error('authorized callback not found')

      const result = authorized({
        auth: null,
        request: {
          nextUrl: new URL('http://localhost:3000/api/admin/projects'),
        } as never,
      })

      expect(result).toBe(false)
    })

    it('allows access to /dashboard when user is authenticated', () => {
      if (typeof authorized !== 'function') throw new Error('authorized callback not found')

      const result = authorized({
        auth: {
          user: { id: 'admin-1', email: 'admin@mycareerspace.local' },
          expires: new Date(Date.now() + 10000).toISOString(),
        },
        request: {
          nextUrl: new URL('http://localhost:3000/dashboard'),
        } as never,
      })

      expect(result).toBe(true)
    })

    it('redirects authenticated user away from /login to /dashboard', () => {
      if (typeof authorized !== 'function') throw new Error('authorized callback not found')

      const response = authorized({
        auth: {
          user: { id: 'admin-1', email: 'admin@mycareerspace.local' },
          expires: new Date(Date.now() + 10000).toISOString(),
        },
        request: {
          nextUrl: new URL('http://localhost:3000/login'),
        } as never,
      })

      expect(response).toBeInstanceOf(Response)
      expect((response as Response).headers.get('location')).toBe('http://localhost:3000/dashboard')
    })

    it('allows public routes like / without authentication', () => {
      if (typeof authorized !== 'function') throw new Error('authorized callback not found')

      const result = authorized({
        auth: null,
        request: {
          nextUrl: new URL('http://localhost:3000/'),
        } as never,
      })

      expect(result).toBe(true)
    })

    it('invalidates access after session is cleared / user logged out', () => {
      if (typeof authorized !== 'function') throw new Error('authorized callback not found')

      // Simulated logged-out state (auth is null or user is undefined)
      const loggedOutResult = authorized({
        auth: { user: undefined, expires: '' } as never,
        request: {
          nextUrl: new URL('http://localhost:3000/dashboard'),
        } as never,
      })

      expect(loggedOutResult).toBe(false)
    })
  })
})
