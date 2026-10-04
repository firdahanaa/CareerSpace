import { requireAdmin } from '@/lib/auth'
import { Sidebar } from '@/components/dashboard/sidebar'
import { MobileNav } from '@/components/dashboard/mobile-nav'
import { logoutAction } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAdmin()

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop static sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col border-r border-border z-30">
        <Sidebar userEmail={user.email ?? undefined} />
      </div>

      {/* Main content wrapper */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Mobile top header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm md:hidden">
          <div className="flex items-center gap-2">
            <MobileNav userEmail={user.email ?? undefined} />
            <span className="font-semibold text-sm tracking-tight">MyCareerSpace</span>
          </div>
          <form action={logoutAction}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title="Keluar">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </header>

        {/* Dynamic page content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
