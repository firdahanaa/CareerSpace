import { describe, it, expect } from 'vitest'
import {
  profileFormSchema,
  filterVisibleContacts,
  type ContactVisibilitySettings,
} from '@/lib/validation/profile'
import { validateImageFile } from '@/lib/storage'

describe('Profile Validation & Visibility Logic', () => {
  // 1. Validasi Zod (Nama kosong, URL tidak valid, field opsional)
  describe('Zod Schema Validation (profileFormSchema)', () => {
    it('rejects empty fullName with descriptive error message', () => {
      const result = profileFormSchema.safeParse({
        fullName: '',
        headline: 'Software Engineer',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.fullName).toContain('Nama lengkap wajib diisi')
      }
    })

    it('rejects empty headline with descriptive error message', () => {
      const result = profileFormSchema.safeParse({
        fullName: 'Firda Hana',
        headline: '   ',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.headline).toContain('Headline wajib diisi')
      }
    })

    it('rejects invalid LinkedIn and GitHub URLs', () => {
      const result = profileFormSchema.safeParse({
        fullName: 'Firda Hana',
        headline: 'Software Engineer',
        linkedinUrl: 'not-a-valid-url',
        githubUrl: 'ftp://not-http.com',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors
        expect(errors.linkedinUrl?.[0]).toContain('Format URL LinkedIn tidak valid')
        expect(errors.githubUrl?.[0]).toContain('Format URL GitHub tidak valid')
      }
    })

    it('rejects invalid email format', () => {
      const result = profileFormSchema.safeParse({
        fullName: 'Firda Hana',
        headline: 'Software Engineer',
        email: 'invalid-email-format',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.email).toContain('Format email tidak valid')
      }
    })

    it('accepts empty optional fields and transforms them to null (PROF-03)', () => {
      const result = profileFormSchema.safeParse({
        fullName: 'Firda Hana',
        headline: 'Full-Stack Developer',
        summary: '',
        email: '',
        phone: '',
        location: '',
        linkedinUrl: '',
        githubUrl: '',
        otherLinks: [],
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.summary).toBeNull()
        expect(result.data.email).toBeNull()
        expect(result.data.phone).toBeNull()
        expect(result.data.location).toBeNull()
        expect(result.data.linkedinUrl).toBeNull()
        expect(result.data.githubUrl).toBeNull()
        expect(result.data.otherLinks).toEqual([])
      }
    })

    it('accepts valid full profile with valid URLs and custom otherLinks', () => {
      const result = profileFormSchema.safeParse({
        fullName: 'Firda Hana',
        headline: 'Software Engineer',
        summary: 'Experienced web developer.',
        email: 'firda@example.com',
        phone: '+628123456789',
        location: 'Jakarta, Indonesia',
        linkedinUrl: 'https://linkedin.com/in/firdahana',
        githubUrl: 'https://github.com/firdahana',
        otherLinks: [
          { label: 'Personal Blog', url: 'https://firdahana.dev/blog' },
        ],
        showEmail: true,
        showPhone: false,
        showLocation: true,
        showLinkedin: true,
        showGithub: true,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.fullName).toBe('Firda Hana')
        expect(result.data.otherLinks).toHaveLength(1)
        expect(result.data.otherLinks[0].label).toBe('Personal Blog')
      }
    })
  })

  // 2. Fungsi Filter Kontak Sesuai Visibilitas (PROF-04, PROF-05, AGENTS.md #10)
  describe('filterVisibleContacts function', () => {
    const fullProfile = {
      email: 'contact@example.com',
      phone: '+628111222333',
      location: 'Bandung, Indonesia',
      linkedinUrl: 'https://linkedin.com/in/testuser',
      githubUrl: 'https://github.com/testuser',
      otherLinks: [{ label: 'Site', url: 'https://mysite.com' }],
    }

    it('hides contact fields when visibility settings are false (PROF-05)', () => {
      const settings: ContactVisibilitySettings = {
        showEmail: false,
        showPhone: false,
        showLocation: false,
        showLinkedin: false,
        showGithub: false,
      }

      const visible = filterVisibleContacts(fullProfile, settings)

      expect(visible.email).toBeNull()
      expect(visible.phone).toBeNull()
      expect(visible.location).toBeNull()
      expect(visible.linkedinUrl).toBeNull()
      expect(visible.githubUrl).toBeNull()
      // Other links remain visible
      expect(visible.otherLinks).toHaveLength(1)
    })

    it('shows allowed contact fields when visibility settings are true', () => {
      const settings: ContactVisibilitySettings = {
        showEmail: true,
        showPhone: true,
        showLocation: true,
        showLinkedin: true,
        showGithub: true,
      }

      const visible = filterVisibleContacts(fullProfile, settings)

      expect(visible.email).toBe('contact@example.com')
      expect(visible.phone).toBe('+628111222333')
      expect(visible.location).toBe('Bandung, Indonesia')
      expect(visible.linkedinUrl).toBe('https://linkedin.com/in/testuser')
      expect(visible.githubUrl).toBe('https://github.com/testuser')
    })

    it('does not display empty elements even if visibility is true (AGENTS.md #10)', () => {
      const emptyProfile = {
        email: '',
        phone: null,
        location: '   ',
        linkedinUrl: null,
        githubUrl: undefined,
      }

      const settings: ContactVisibilitySettings = {
        showEmail: true,
        showPhone: true,
        showLocation: true,
        showLinkedin: true,
        showGithub: true,
      }

      const visible = filterVisibleContacts(emptyProfile, settings)

      expect(visible.email).toBeNull()
      expect(visible.phone).toBeNull()
      expect(visible.location).toBeNull()
      expect(visible.linkedinUrl).toBeNull()
      expect(visible.githubUrl).toBeNull()
    })
  })

  // 3. Validasi Upload Foto Profil
  describe('validateImageFile logic', () => {
    it('accepts valid JPEG, PNG, and WebP files under 2MB', () => {
      expect(validateImageFile({ size: 1024 * 500, type: 'image/jpeg' }).valid).toBe(true)
      expect(validateImageFile({ size: 1024 * 1024, type: 'image/png' }).valid).toBe(true)
      expect(validateImageFile({ size: 1024 * 1500, type: 'image/webp' }).valid).toBe(true)
    })

    it('rejects unsupported image types (e.g., SVG, GIF, PDF)', () => {
      const res = validateImageFile({ size: 1024 * 500, type: 'image/gif' })
      expect(res.valid).toBe(false)
      expect(res.error).toContain('Format foto tidak didukung')
    })

    it('rejects files exceeding 2MB limit', () => {
      const res = validateImageFile({ size: 3 * 1024 * 1024, type: 'image/jpeg' })
      expect(res.valid).toBe(false)
      expect(res.error).toContain('Ukuran foto melebihi batas maksimal 2MB')
    })
  })
})
