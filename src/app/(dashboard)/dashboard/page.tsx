import Link from 'next/link'
import { getDashboardOverviewData, type RecentUpdateItem } from '@/lib/queries/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FolderGit2,
  Briefcase,
  GraduationCap,
  Award,
  Globe,
  Plus,
  FileText,
  ExternalLink,
  ArrowRight,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard Overview — MyCareerSpace',
  description: 'Ringkasan data karier, status portofolio, dan aktivitas terbaru.',
}

function formatDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  } catch {
    return new Date(date).toLocaleDateString()
  }
}

function getTypeBadgeVariant(type: RecentUpdateItem['type']): string {
  switch (type) {
    case 'PROJECT':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
    case 'EXPERIENCE':
      return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20'
    case 'EDUCATION':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
    case 'CERTIFICATION':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
    case 'CV':
      return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
    default:
      return ''
  }
}

function getTypeLabel(type: RecentUpdateItem['type']): string {
  switch (type) {
    case 'PROJECT':
      return 'Project'
    case 'EXPERIENCE':
      return 'Experience'
    case 'EDUCATION':
      return 'Education'
    case 'CERTIFICATION':
      return 'Certification'
    case 'CV':
      return 'CV Config'
  }
}

export default async function DashboardOverviewPage() {
  const data = await getDashboardOverviewData()
  const { counts, portfolio, recentUpdates, profile, admin } = data

  return (
    <div className="space-y-8">
      {/* Top Banner: Greeting & Quick Actions (DASH-02) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
            <Badge variant="outline" className="text-xs font-normal">
              Admin
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Selamat datang kembali,{' '}
            <span className="font-semibold text-foreground">
              {profile?.fullName || admin.email}
            </span>
            . Berikut ringkasan data identitas profesional Anda.
          </p>
        </div>

        {/* Quick Actions (DASH-02) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link href="/dashboard/projects">
            <Button size="sm" className="gap-2 font-medium shadow-xs">
              <Plus className="h-4 w-4" />
              Tambah Project
            </Button>
          </Link>
          <Link href="/dashboard/cvs">
            <Button size="sm" variant="outline" className="gap-2 font-medium">
              <FileText className="h-4 w-4" />
              Buat CV
            </Button>
          </Link>
        </div>
      </div>

      {/* Portfolio Status Banner (DASH-03) */}
      <Card className="border-border shadow-xs overflow-hidden">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Globe className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-base font-semibold text-foreground">
                    Status Portofolio Publik
                  </span>
                  {portfolio?.isPublished ? (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                      Aktif (Dipublikasikan)
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-500/30">
                      Belum Dipublikasikan (Draft)
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {portfolio?.isPublished
                    ? 'Portofolio publik Anda aktif dan dapat diakses oleh pengunjung di tautan publik.'
                    : 'Portofolio saat ini disembunyikan dari publik. Hanya data yang ditandai published yang akan tampil bila diaktifkan.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:self-center shrink-0">
              {portfolio?.isPublished ? (
                <Link
                  href={`/${portfolio.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <span>Lihat Portofolio</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              ) : (
                <Link href="/dashboard/portfolio">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <span>Kelola Publikasi</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Record Counts Cards (DASH-01) */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Data Karier & Identitas
          </h2>
          <span className="text-xs text-muted-foreground">DASH-01</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Projects */}
          <Link href="/dashboard/projects" className="group">
            <Card className="h-full border-border transition-all duration-200 hover:border-primary/50 hover:shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Projects
                </CardTitle>
                <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <FolderGit2 className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {counts.projects.total}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {counts.projects.published} dipublikasikan, {counts.projects.total - counts.projects.published} privat
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Experience */}
          <Link href="/dashboard/experience" className="group">
            <Card className="h-full border-border transition-all duration-200 hover:border-primary/50 hover:shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Experience
                </CardTitle>
                <div className="h-8 w-8 rounded-md bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Briefcase className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {counts.experiences.total}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {counts.experiences.published} dipublikasikan, {counts.experiences.total - counts.experiences.published} privat
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Education */}
          <Link href="/dashboard/education" className="group">
            <Card className="h-full border-border transition-all duration-200 hover:border-primary/50 hover:shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Education
                </CardTitle>
                <div className="h-8 w-8 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <GraduationCap className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {counts.education.total}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {counts.education.published} dipublikasikan
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Certifications */}
          <Link href="/dashboard/certifications" className="group">
            <Card className="h-full border-border transition-all duration-200 hover:border-primary/50 hover:shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Certifications
                </CardTitle>
                <div className="h-8 w-8 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Award className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {counts.certifications.total}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {counts.certifications.published} dipublikasikan
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Bottom Section: Recent Updates (5 Items) & System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Recent Updates */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Update Terbaru</span>
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    5 record karier atau konfigurasi yang paling baru diubah
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[11px] font-normal">
                  Terakhir Diubah
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border">
              {recentUpdates.length > 0 ? (
                recentUpdates.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-medium shrink-0 mt-0.5 ${getTypeBadgeVariant(
                          item.type
                        )}`}
                      >
                        {getTypeLabel(item.type)}
                      </Badge>
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium text-foreground block">
                          {item.title}
                        </span>
                        {item.subtitle && (
                          <span className="text-xs text-muted-foreground block">
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:self-center self-end shrink-0">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${
                          item.published
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {item.published ? 'Publik' : 'Privat'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.updatedAt)}
                      </span>
                      <Link href={item.href}>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                          Buka
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Belum ada data rekaman karier yang diubah.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1/3): Quick Overview & PRD Principles */}
        <div className="space-y-4">
          {/* Secondary stats: Skills & CVs */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">
                Ringkasan Tambahan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 text-sm">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">Skills Terdaftar</span>
                </div>
                <span className="font-bold text-foreground">{counts.skills.total}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 text-sm">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">Konfigurasi CV</span>
                </div>
                <span className="font-bold text-foreground">{counts.cvs.total}</span>
              </div>
            </CardContent>
          </Card>

          {/* Core System Rule (PRD 1.1) */}
          <Card className="border-border shadow-xs bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                <span>Prinsip MyCareerSpace</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs text-muted-foreground leading-relaxed pt-0">
              <p>
                <strong>Satu Sumber Kebenaran:</strong> Data karier diisi sekali di dashboard privat, lalu dipakai untuk dua keluaran:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong className="text-foreground">Portofolio Publik:</strong> Hanya record dengan status <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">published = true</code> yang dapat dilihat pengunjung.
                </li>
                <li>
                  <strong className="text-foreground">CV PDF ATS:</strong> Menggunakan referensi record yang sama per target role. Project privat tetap boleh masuk CV privat.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
