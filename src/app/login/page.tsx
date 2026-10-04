import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/forms/login-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login Administrator — MyCareerSpace',
  description: 'Halaman masuk administrator privat MyCareerSpace',
}

export default async function LoginPage() {
  const session = await auth()

  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/40">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <div className="text-center space-y-1">
          <span className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">
            MyCareerSpace
          </span>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
