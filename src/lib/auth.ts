import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from '@/lib/auth.config'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { loginSchema } from '@/lib/validation/auth'
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '@/lib/rate-limit'

/**
 * Verifikasi kredensial terhadap tabel Administrator.
 * Mengembalikan data admin jika valid, atau null jika tidak valid.
 * Pesan error di tingkat presentasi harus generik ("Email atau password salah").
 */
export async function verifyAdminCredentials(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim()
  const admin = await db.administrator.findUnique({
    where: { email: normalizedEmail },
  })

  if (!admin) {
    return null
  }

  const isMatch = await bcrypt.compare(password, admin.passwordHash)
  if (!isMatch) {
    return null
  }

  return {
    id: admin.id,
    email: admin.email,
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) {
          return null
        }

        const { email, password } = parsed.data
        const rateLimitKey = `login:${email.toLowerCase()}`
        const rateLimit = checkRateLimit(rateLimitKey)

        if (!rateLimit.allowed) {
          throw new Error(`RATE_LIMIT:${rateLimit.retryAfterSeconds}`)
        }

        const admin = await verifyAdminCredentials(email, password)
        if (!admin) {
          recordFailedAttempt(rateLimitKey)
          return null
        }

        resetRateLimit(rateLimitKey)
        return admin
      },
    }),
  ],
})

/**
 * Server-side security check untuk Server Actions dan Route Handlers privat.
 * WAJIB dipanggil di setiap server action / API route privat (AUTH-03).
 */
export async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('UNAUTHORIZED: Sesi admin tidak valid atau telah berakhir')
  }
  return {
    ...session.user,
    id: session.user.id,
  }
}

