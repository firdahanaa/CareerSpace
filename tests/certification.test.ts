import { describe, it, expect } from 'vitest'
import {
  certificationFormSchema,
  isCertificationExpired,
} from '@/lib/validation/certification'

describe('Certification CRUD Logic & Validation (PRD 5.6)', () => {
  // 1. Validasi Field Wajib
  describe('Validasi Field Wajib (certificationFormSchema)', () => {
    it('rejects empty title with descriptive error message', () => {
      const result = certificationFormSchema.safeParse({
        title: '   ',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.title).toContain(
          'Judul sertifikasi atau pencapaian wajib diisi'
        )
      }
    })

    it('rejects title exceeding 150 characters', () => {
      const result = certificationFormSchema.safeParse({
        title: 'T'.repeat(151),
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.title).toContain(
          'Judul sertifikasi maksimal 150 karakter'
        )
      }
    })

    it('accepts valid required title and applies defaults', () => {
      const result = certificationFormSchema.safeParse({
        title: 'AWS Certified Solutions Architect - Associate',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('AWS Certified Solutions Architect - Associate')
        expect(result.data.published).toBe(false)
        expect(result.data.issuer).toBeNull()
        expect(result.data.issueDate).toBeNull()
        expect(result.data.expirationDate).toBeNull()
        expect(result.data.credentialId).toBeNull()
        expect(result.data.credentialUrl).toBeNull()
        expect(result.data.description).toBeNull()
      }
    })
  })

  // 2. Field Opsional & Validasi URL
  describe('Field Opsional & Validasi URL Kredensial', () => {
    it('transforms empty strings to null for optional fields', () => {
      const result = certificationFormSchema.safeParse({
        title: 'Juara 1 Lomba Web Design Nasional',
        issuer: '',
        credentialId: '   ',
        credentialUrl: '',
        description: '',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.issuer).toBeNull()
        expect(result.data.credentialId).toBeNull()
        expect(result.data.credentialUrl).toBeNull()
        expect(result.data.description).toBeNull()
      }
    })

    it('validates URL format correctly', () => {
      const validUrls = [
        'https://aws.amazon.com/verification/12345',
        'http://example.com/certificate/abc',
      ]

      for (const url of validUrls) {
        const result = certificationFormSchema.safeParse({
          title: 'Cloud Practitioner',
          credentialUrl: url,
        })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.credentialUrl).toBe(url)
        }
      }

      const invalidUrls = ['not-a-valid-url', 'ftp://ftp.example.com', 'javascript:alert(1)']
      for (const invalid of invalidUrls) {
        const result = certificationFormSchema.safeParse({
          title: 'Cloud Practitioner',
          credentialUrl: invalid,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.flatten().fieldErrors.credentialUrl).toBeDefined()
        }
      }
    })
  })

  // 3. Validasi Tanggal (expirationDate >= issueDate)
  describe('Validasi Tanggal Terbit & Kedaluwarsa', () => {
    it('rejects expirationDate earlier than issueDate', () => {
      const result = certificationFormSchema.safeParse({
        title: 'Certified Kubernetes Administrator',
        issueDate: '2025-01-01',
        expirationDate: '2024-01-01',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.expirationDate).toContain(
          'Tanggal kedaluwarsa tidak boleh sebelum tanggal penerbitan'
        )
      }
    })

    it('accepts expirationDate after or same as issueDate', () => {
      const result = certificationFormSchema.safeParse({
        title: 'Certified Kubernetes Administrator',
        issueDate: '2023-05-10',
        expirationDate: '2026-05-10',
      })

      expect(result.success).toBe(true)
    })

    it('accepts only issueDate (no expiry/lifetime credential)', () => {
      const result = certificationFormSchema.safeParse({
        title: 'Juara 1 Hackathon',
        issueDate: '2024-08-17',
      })

      expect(result.success).toBe(true)
    })
  })

  // 4. Helper isCertificationExpired
  describe('isCertificationExpired() Helper', () => {
    it('returns false when expirationDate is null, undefined, or empty', () => {
      expect(isCertificationExpired(null)).toBe(false)
      expect(isCertificationExpired(undefined)).toBe(false)
      expect(isCertificationExpired('')).toBe(false)
    })

    it('returns true when expirationDate is in the past', () => {
      const pastDate = new Date('2020-01-01')
      expect(isCertificationExpired(pastDate)).toBe(true)
      expect(isCertificationExpired('2020-01-01')).toBe(true)
    })

    it('returns false when expirationDate is in the future', () => {
      const futureDate = new Date('2099-12-31')
      expect(isCertificationExpired(futureDate)).toBe(false)
      expect(isCertificationExpired('2099-12-31')).toBe(false)
    })

    it('returns false when expirationDate is today', () => {
      const today = new Date()
      expect(isCertificationExpired(today)).toBe(false)
    })
  })
})
