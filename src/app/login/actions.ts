'use server'

import { signIn, signOut } from '@/lib/auth'
import { loginSchema } from '@/lib/validation/auth'
import { AuthError } from 'next-auth'

export interface LoginActionResult {
  success: boolean
  error?: string
}

export async function loginAction(
  _prevState: LoginActionResult | null,
  formData: FormData
): Promise<LoginActionResult> {
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = loginSchema.safeParse(rawData)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Email atau password salah',
    }
  }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: '/dashboard',
    })

    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      const errMessage = error.cause?.err?.message
      if (errMessage?.startsWith('RATE_LIMIT:')) {
        const seconds = parseInt(errMessage.split(':')[1] || '60', 10)
        const minutes = Math.ceil(seconds / 60)
        return {
          success: false,
          error: `Terlalu banyak percobaan gagal. Silakan tunggu ${minutes} menit sebelum mencoba lagi.`,
        }
      }

      // Pesan error generik sesuai AUTH-02: tidak membocorkan apakah email ada
      return {
        success: false,
        error: 'Email atau password salah',
      }
    }

    // Next.js redirect thrown by signIn should bubble up
    throw error
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: '/login' })
}
