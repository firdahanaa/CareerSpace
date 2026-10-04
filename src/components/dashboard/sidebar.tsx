import { SidebarNav } from '@/components/dashboard/sidebar-nav'
import { logoutAction } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface SidebarProps {
  userEmail?: string
  onItemClick?: () => void
}

export function Sidebar({ userEmail, onItemClick }: SidebarProps) {
  return (
    <aside className="flex h-full flex-col justify-between bg-card text-card-foreground">
      {/* Brand header */}
      <div>
        <div className="flex items-center gap-2 px-6 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-base shadow-xs">
            M
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm leading-tight tracking-tight">
              MyCareerSpace
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              Admin CMS
            </span>
          </div>
        </div>

        <Separator />

        {/* Navigation links */}
        <div className="py-2">
          <SidebarNav onItemClick={onItemClick} />
        </div>
      </div>

      {/* User profile & logout footer */}
      <div>
        <Separator />
        <div className="p-4 flex flex-col gap-3">
          {userEmail && (
            <div className="flex flex-col truncate px-2">
              <span className="text-xs text-muted-foreground font-medium">Masuk sebagai</span>
              <span className="text-xs font-semibold truncate text-foreground" title={userEmail}>
                {userEmail}
              </span>
            </div>
          )}
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar</span>
            </Button>
          </form>
        </div>
      </div>
    </aside>
  )
}
