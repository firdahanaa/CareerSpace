import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface PagePlaceholderProps {
  title: string
  description: string
  icon?: LucideIcon
}

export function PagePlaceholder({ title, description, icon: Icon }: PagePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <Card className="border-dashed border-2 bg-muted/10">
        <CardHeader className="text-center py-16">
          {Icon && (
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
              <Icon className="h-6 w-6" />
            </div>
          )}
          <CardTitle className="text-lg font-semibold text-foreground">Segera Hadir</CardTitle>
          <CardDescription className="max-w-md mx-auto text-sm mt-1">
            Modul {title.toLowerCase()} sedang disiapkan. Fungsionalitas manajemen data akan dibangun pada tahap berikutnya sesuai roadmap pengerjaan di AGENTS.md.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
