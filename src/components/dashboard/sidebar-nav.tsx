'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  User,
  FolderGit2,
  Briefcase,
  GraduationCap,
  Code2,
  Award,
  Globe,
  FileText,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { title: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Profile', href: '/dashboard/profile', icon: User },
  { title: 'Projects', href: '/dashboard/projects', icon: FolderGit2 },
  { title: 'Experience', href: '/dashboard/experience', icon: Briefcase },
  { title: 'Education', href: '/dashboard/education', icon: GraduationCap },
  { title: 'Skills', href: '/dashboard/skills', icon: Code2 },
  { title: 'Certifications', href: '/dashboard/certifications', icon: Award },
  { title: 'Portfolio', href: '/dashboard/portfolio', icon: Globe },
  { title: 'CVs', href: '/dashboard/cvs', icon: FileText },
  { title: 'Settings', href: '/dashboard/settings', icon: Settings },
]

interface SidebarNavProps {
  onItemClick?: () => void
}

export function SidebarNav({ onItemClick }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col space-y-1 p-2">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || pathname.startsWith(`${item.href}/`)

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}
