import Image from 'next/image'
import Link from 'next/link'
import {
  filterVisibleContacts,
  type ContactVisibilitySettings,
  type OtherLinkItem,
} from '@/lib/validation/profile'
import { Mail, Phone, MapPin, ExternalLink, Globe } from 'lucide-react'

export interface ProfileCardData {
  fullName: string
  headline: string
  summary?: string | null
  photoUrl?: string | null
  email?: string | null
  phone?: string | null
  location?: string | null
  linkedinUrl?: string | null
  githubUrl?: string | null
  otherLinks?: OtherLinkItem[] | unknown
}

interface ProfileCardProps {
  profile: ProfileCardData
  visibility: ContactVisibilitySettings
  className?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

export function ProfileCard({ profile, visibility, className = '' }: ProfileCardProps) {
  const visible = filterVisibleContacts(profile, visibility)
  const initials = getInitials(profile.fullName || 'Admin')

  return (
    <article
      className={`rounded-xl border border-border bg-card p-6 md:p-8 text-card-foreground shadow-xs ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
        {/* Profile Avatar */}
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-2 border-border/80 shadow-xs bg-muted">
          {profile.photoUrl ? (
            <Image
              src={profile.photoUrl}
              alt={profile.fullName}
              fill
              className="object-cover"
              sizes="112px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-bold text-2xl select-none">
              {initials}
            </div>
          )}
        </div>

        {/* Identity & Headline */}
        <div className="flex-1 space-y-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {profile.fullName || 'Nama Lengkap'}
            </h1>
            <p className="text-base font-medium text-muted-foreground mt-0.5">
              {profile.headline || 'Headline Profesional'}
            </p>
          </div>

          {/* Location badge (jika diizinkan & terisi) */}
          {visible.location && (
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground/80" />
              <span>{visible.location}</span>
            </div>
          )}

          {/* Summary / Bio (jika terisi) */}
          {profile.summary && (
            <p className="text-sm text-foreground/80 leading-relaxed max-w-2xl whitespace-pre-line">
              {profile.summary}
            </p>
          )}

          {/* Contact Details (Email, Phone) */}
          {(visible.email || visible.phone) && (
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs">
              {visible.email && (
                <a
                  href={`mailto:${visible.email}`}
                  className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 hover:bg-muted px-2.5 py-1 text-foreground transition-colors font-medium"
                >
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  <span>{visible.email}</span>
                </a>
              )}
              {visible.phone && (
                <a
                  href={`tel:${visible.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 hover:bg-muted px-2.5 py-1 text-foreground transition-colors font-medium"
                >
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  <span>{visible.phone}</span>
                </a>
              )}
            </div>
          )}

          {/* Links & Socials (LinkedIn, GitHub, Other Links) */}
          {(visible.linkedinUrl || visible.githubUrl || visible.otherLinks.length > 0) && (
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
              {visible.linkedinUrl && (
                <Link
                  href={visible.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline px-2 py-1 rounded-md border border-primary/20 hover:bg-primary/5 transition-colors"
                >
                  <span>LinkedIn</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}

              {visible.githubUrl && (
                <Link
                  href={visible.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:underline px-2 py-1 rounded-md border border-border hover:bg-muted/50 transition-colors"
                >
                  <span>GitHub</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}

              {visible.otherLinks.map((link) => (
                <Link
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:underline px-2 py-1 rounded-md border border-border hover:bg-muted/50 transition-colors"
                >
                  <Globe className="h-3 w-3" />
                  <span>{link.label}</span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
