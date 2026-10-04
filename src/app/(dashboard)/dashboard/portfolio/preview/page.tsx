import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { getPublicPortfolioBySlug } from '@/lib/queries/public'
import { ProfileCard } from '@/components/public/profile-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { FeaturedBadge } from '@/components/dashboard/status-badge'
import {
  Eye,
  ArrowLeft,
  ExternalLink,
  FolderGit2,
  Briefcase,
  GraduationCap,
  Sparkles,
  Award,
  Calendar,
  Globe,
  Code2,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pratinjau Portofolio Publik — MyCareerSpace',
  description: 'Pratinjau tampilan portofolio sebagaimana dilihat pengunjung.',
}

export default async function PortfolioPreviewPage() {
  const admin = await requireAdmin()

  const profile = await db.profile.findUnique({
    where: { administratorId: admin.id },
    include: { settings: true },
  })

  if (!profile || !profile.settings) {
    redirect('/dashboard/portfolio')
  }

  // Ambil data menggunakan query publik kanonik dengan opsi { preview: true }
  const data = await getPublicPortfolioBySlug(profile.settings.slug, { preview: true })

  if (!data) {
    redirect('/dashboard/portfolio')
  }

  const { settings, projects, featuredProjects, experiences, educations, skills, certifications } =
    data

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Top Admin Preview Banner */}
      <div className="sticky top-0 z-50 border-b border-amber-500/30 bg-amber-500/10 backdrop-blur-md px-4 py-3 text-foreground shadow-xs">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300">
              <Eye className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Pratinjau Mode Pengunjung
                </span>
                <Badge
                  variant="outline"
                  className={
                    settings.isPublished
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[11px]'
                      : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40 text-[11px]'
                  }
                >
                  {settings.isPublished ? 'Portofolio Publik Aktif' : 'Portofolio Draf (Belum Publik)'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Merender data yang difilter <code className="text-[11px] font-mono bg-muted/60 px-1 py-0.5 rounded">published = true</code> sesuai apa yang akan dilihat pengunjung luar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/dashboard/portfolio">
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs bg-background">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Kembali ke Editor</span>
              </Button>
            </Link>

            {settings.isPublished && (
              <Link href={`/${settings.slug}`} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="default" className="gap-1.5 h-8 text-xs">
                  <span>Buka URL Publik</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-12">
        {/* 1. Profile Section */}
        <section aria-label="Profil Utama">
          <ProfileCard
            profile={data.profile}
            visibility={{
              showEmail: settings.showEmail,
              showPhone: settings.showPhone,
              showLocation: settings.showLocation,
              showLinkedin: settings.showLinkedin,
              showGithub: settings.showGithub,
            }}
          />
        </section>

        {/* 2. Featured Projects (PORT-04) */}
        {featuredProjects.length > 0 && (
          <section aria-label="Proyek Unggulan" className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h2 className="text-xl font-bold tracking-tight">Proyek Unggulan</h2>
              </div>
              <span className="text-xs text-muted-foreground font-medium">Featured</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredProjects.map((p) => (
                <Card key={p.id} className="border-border bg-card shadow-xs flex flex-col justify-between">
                  <CardContent className="p-5 space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-base text-foreground leading-snug">{p.title}</h3>
                        <FeaturedBadge featured={true} />
                      </div>
                      {p.projectType && (
                        <span className="text-xs text-muted-foreground block">{p.projectType}</span>
                      )}
                    </div>

                    <p className="text-xs text-foreground/80 leading-relaxed line-clamp-3">
                      {p.shortSummary}
                    </p>

                    {p.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {p.technologies.map((t) => (
                          <span
                            key={t}
                            className="inline-block text-[11px] font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded-sm"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {(p.demoUrl || p.repositoryUrl) && (
                      <div className="flex items-center gap-2.5 pt-2 text-xs">
                        {p.demoUrl && (
                          <a
                            href={p.demoUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                          >
                            <Globe className="h-3 w-3" />
                            <span>Demo</span>
                          </a>
                        )}
                        {p.repositoryUrl && (
                          <a
                            href={p.repositoryUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground font-medium"
                          >
                            <Code2 className="h-3 w-3" />
                            <span>Kode</span>
                          </a>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* 3. All Published Projects */}
        <section aria-label="Semua Proyek Publik" className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <FolderGit2 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight">Proyek Publik</h2>
            </div>
            <span className="text-xs text-muted-foreground">{projects.length} proyek</span>
          </div>

          {projects.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-lg text-sm text-muted-foreground bg-muted/20">
              Belum ada proyek yang berstatus <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">published = true</code>.
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-lg border border-border bg-card hover:bg-muted/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{p.title}</span>
                      {p.featured && <FeaturedBadge featured={true} />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 max-w-xl">{p.shortSummary}</p>
                    {p.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {p.technologies.slice(0, 5).map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded-sm"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {(p.demoUrl || p.repositoryUrl) && (
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {p.demoUrl && (
                        <a
                          href={p.demoUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Demo</span>
                        </a>
                      )}
                      {p.repositoryUrl && (
                        <a
                          href={p.repositoryUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium"
                        >
                          <Code2 className="h-3 w-3" />
                          <span>Repo</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 4. Published Experiences */}
        <section aria-label="Pengalaman" className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight">Pengalaman</h2>
            </div>
            <span className="text-xs text-muted-foreground">{experiences.length} entri</span>
          </div>

          {experiences.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-lg text-sm text-muted-foreground bg-muted/20">
              Belum ada pengalaman kerja atau organisasi yang berstatus published.
            </div>
          ) : (
            <div className="space-y-4">
              {experiences.map((exp) => (
                <div key={exp.id} className="p-4 rounded-lg border border-border bg-card space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <h3 className="font-semibold text-sm text-foreground">{exp.position}</h3>
                      <p className="text-xs text-muted-foreground font-medium">{exp.organization}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {exp.startDate
                          ? new Date(exp.startDate).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
                          : ''}
                        {' - '}
                        {exp.isCurrent
                          ? 'Sekarang'
                          : exp.endDate
                          ? new Date(exp.endDate).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
                          : ''}
                      </span>
                    </div>
                  </div>

                  {exp.description && (
                    <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">
                      {exp.description}
                    </p>
                  )}

                  {exp.responsibilities.length > 0 && (
                    <ul className="list-disc list-inside text-xs text-foreground/80 space-y-0.5">
                      {exp.responsibilities.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 5. Published Education */}
        <section aria-label="Pendidikan" className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight">Pendidikan</h2>
            </div>
            <span className="text-xs text-muted-foreground">{educations.length} entri</span>
          </div>

          {educations.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-lg text-sm text-muted-foreground bg-muted/20">
              Belum ada riwayat pendidikan yang berstatus published.
            </div>
          ) : (
            <div className="space-y-3">
              {educations.map((edu) => (
                <div key={edu.id} className="p-4 rounded-lg border border-border bg-card space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-sm text-foreground">{edu.institution}</h3>
                    {edu.gpa && (
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-sm">
                        IPK: {edu.gpa}
                      </span>
                    )}
                  </div>
                  {(edu.degree || edu.fieldOfStudy) && (
                    <p className="text-xs text-muted-foreground">
                      {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(' • ')}
                    </p>
                  )}
                  {edu.description && (
                    <p className="text-xs text-muted-foreground/90 italic pt-1">{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 6. Published Skills */}
        <section aria-label="Keahlian" className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight">Keahlian</h2>
            </div>
            <span className="text-xs text-muted-foreground">{skills.length} keahlian</span>
          </div>

          {skills.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-lg text-sm text-muted-foreground bg-muted/20">
              Belum ada keahlian yang berstatus published.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <Badge
                  key={s.id}
                  variant="secondary"
                  className="text-xs font-medium px-3 py-1 bg-muted hover:bg-muted/80"
                >
                  {s.name}
                </Badge>
              ))}
            </div>
          )}
        </section>

        {/* 7. Published Certifications */}
        <section aria-label="Sertifikasi & Pencapaian" className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight">Sertifikasi & Pencapaian</h2>
            </div>
            <span className="text-xs text-muted-foreground">{certifications.length} entri</span>
          </div>

          {certifications.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-lg text-sm text-muted-foreground bg-muted/20">
              Belum ada sertifikasi yang berstatus published.
            </div>
          ) : (
            <div className="space-y-3">
              {certifications.map((c) => (
                <div key={c.id} className="p-4 rounded-lg border border-border bg-card space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-foreground">{c.title}</span>
                    {c.credentialUrl && (
                      <a
                        href={c.credentialUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Verifikasi</span>
                      </a>
                    )}
                  </div>
                  {c.issuer && <p className="text-xs text-muted-foreground">{c.issuer}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
