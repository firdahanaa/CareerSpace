import { Badge } from '@/components/ui/badge'
import { Eye, EyeOff, Sparkles } from 'lucide-react'

export interface PublishedBadgeProps {
  published: boolean
  className?: string
}

export function PublishedBadge({ published, className }: PublishedBadgeProps) {
  if (published) {
    return (
      <Badge
        variant="default"
        className={`bg-emerald-600/15 text-emerald-700 hover:bg-emerald-600/20 dark:bg-emerald-500/20 dark:text-emerald-400 gap-1 font-medium text-xs px-2 py-0.5 border border-emerald-500/30 ${className || ''}`}
      >
        <Eye className="h-3 w-3" />
        <span>Published</span>
      </Badge>
    )
  }

  return (
    <Badge
      variant="secondary"
      className={`bg-muted text-muted-foreground gap-1 font-medium text-xs px-2 py-0.5 border border-border ${className || ''}`}
    >
      <EyeOff className="h-3 w-3" />
      <span>Private</span>
    </Badge>
  )
}

export interface FeaturedBadgeProps {
  featured: boolean
  className?: string
}

export function FeaturedBadge({ featured, className }: FeaturedBadgeProps) {
  if (!featured) return null

  return (
    <Badge
      variant="default"
      className={`bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 gap-1 font-medium text-xs px-2 py-0.5 border border-amber-500/30 ${className || ''}`}
    >
      <Sparkles className="h-3 w-3" />
      <span>Featured</span>
    </Badge>
  )
}
