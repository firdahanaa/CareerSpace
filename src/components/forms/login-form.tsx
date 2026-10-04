'use client'

import { useActionState } from 'react'
import { loginAction, type LoginActionResult } from '@/app/login/actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<LoginActionResult | null, FormData>(
    loginAction,
    null
  )

  return (
    <Card className="w-full max-w-md shadow-lg border-border">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Masuk Admin</CardTitle>
        <CardDescription>
          Masukkan kredensial administrator untuk mengelola MyCareerSpace.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <div
              role="alert"
              className="rounded-md bg-destructive/15 p-3 text-sm font-medium text-destructive border border-destructive/20"
            >
              {state.error}
            </div>
          )}

          <div className="space-y-2 text-left">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@example.com"
              autoComplete="email"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2 text-left">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              disabled={isPending}
            />
          </div>
        </CardContent>

        <CardFooter className="pt-2">
          <Button
            type="submit"
            className="w-full font-medium"
            disabled={isPending}
          >
            {isPending ? 'Memverifikasi...' : 'Masuk ke Dashboard'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
