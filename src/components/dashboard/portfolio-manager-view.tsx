'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { AdminPortfolioManagerData, AdminPortfolioRecordItem } from '@/lib/queries/admin'
import {
  updatePortfolioSettingsAction,
  toggleProjectFeaturedQuickAction,
  toggleRecordPublishedQuickAction,
  type PortfolioActionState,
} from '@/app/(dashboard)/dashboard/portfolio/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PublishedBadge, FeaturedBadge } from '@/components/dashboard/status-badge'
import {
  Globe,
  Eye,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  FolderGit2,
  Briefcase,
  GraduationCap,
  Award,
  Info,
  Loader2,
  ArrowRight,
  UserCheck,
} from 'lucide-react'

export interface PortfolioManagerViewProps {
  data: AdminPortfolioManagerData
}

export function PortfolioManagerView({ data }: PortfolioManagerViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Form State
  const [isPublished, setIsPublished] = useState(data.settings?.isPublished || false)
  const [slug, setSlug] = useState(data.settings?.slug || '')

  // Notification State
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>(undefined)

  const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setNotification(null)
    setFieldErrors(undefined)

    const formData = new FormData()
    formData.set('slug', slug)
    formData.set('isPublished', String(isPublished))

    startTransition(async () => {
      const res: PortfolioActionState = await updatePortfolioSettingsAction(null, formData)
      if (res.success) {
        setNotification({
          type: 'success',
          message: res.message || 'Pengaturan portofolio berhasil disimpan.',
        })
        if (res.slug) setSlug(res.slug)
        if (res.isPublished !== undefined) setIsPublished(res.isPublished)
        router.refresh()
      } else {
        setNotification({
          type: 'error',
          message: res.message || 'Gagal menyimpan pengaturan portofolio.',
        })
        setFieldErrors(res.fieldErrors)
      }
    })
  }

  const handleToggleRecordPublished = (record: AdminPortfolioRecordItem) => {
    setNotification(null)
    startTransition(async () => {
      const res = await toggleRecordPublishedQuickAction(
        record.id,
        record.type as 'PROJECT' | 'EXPERIENCE' | 'EDUCATION' | 'SKILLS' | 'CERTIFICATION'
      )
      if (res.success) {
        router.refresh()
      } else {
        setNotification({ type: 'error', message: res.message })
      }
    })
  }

  const handleToggleProjectFeatured = (projectId: string) => {
    setNotification(null)
    startTransition(async () => {
      const res = await toggleProjectFeaturedQuickAction(projectId)
      if (res.success) {
        router.refresh()
      } else {
        setNotification({ type: 'error', message: res.message })
      }
    })
  }

  const renderRecordRow = (record: AdminPortfolioRecordItem) => {
    const isProject = record.type === 'PROJECT'

    return (
      <div
        key={`${record.type}-${record.id}`}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-border/80 bg-card hover:bg-muted/20 transition-colors"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{record.title}</span>
            <PublishedBadge published={record.published} />
            {isProject && record.featured && <FeaturedBadge featured={true} />}
          </div>
          {record.subtitle && (
            <p className="text-xs text-muted-foreground">{record.subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          {/* Toggle Published */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => handleToggleRecordPublished(record)}
            className="h-8 text-xs gap-1.5"
          >
            {record.published ? 'Setel Privat' : 'Publikasikan'}
          </Button>

          {/* Toggle Featured (khusus project) */}
          {isProject && (
            <Button
              type="button"
              variant={record.featured ? 'secondary' : 'outline'}
              size="sm"
              disabled={isPending}
              onClick={() => handleToggleProjectFeatured(record.id)}
              className="h-8 text-xs gap-1"
            >
              <Sparkles className="h-3 w-3" />
              <span>{record.featured ? 'Batal Unggulan' : 'Jadikan Unggulan'}</span>
            </Button>
          )}

          {/* Link edit ke modul masing-masing */}
          <Link href={record.href}>
            <Button variant="ghost" size="sm" className="h-8 text-xs px-2 text-muted-foreground hover:text-foreground">
              Kelola
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Kelola Portofolio</h1>
            <Badge
              variant="outline"
              className={
                isPublished
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/30'
              }
            >
              {isPublished ? 'Portofolio Publik Aktif' : 'Portofolio Draf (Privat)'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Atur status publikasi, slug alamat web, dan kurasi record yang tampil di portofolio publik Anda.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Tombol Lihat sebagai Pengunjung (Preview) */}
          <Link href="/dashboard/portfolio/preview" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2 shadow-xs">
              <Eye className="h-4 w-4 text-primary" />
              <span>Lihat sebagai pengunjung</span>
            </Button>
          </Link>

          {isPublished && slug && (
            <Link href={`/${slug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="default" className="gap-2 shadow-xs">
                <span>Buka URL Publik</span>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* 2. Notification Banner */}
      {notification && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-lg border text-sm transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <p className="font-medium">{notification.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs underline hover:opacity-80"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 3. Peringatan Profil Belum Lengkap (jika isPublished aktif tapi profil belum lengkap) */}
      {!data.isProfileComplete && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-sm">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <h4 className="font-semibold text-sm">Peringatan: Profil Anda Belum Lengkap</h4>
            <p className="text-xs leading-relaxed opacity-90">
              Portofolio publik memerlukan <strong>Nama Lengkap</strong> dan <strong>Headline Profesional</strong> agar dapat ditampilkan secara layak kepada pengunjung. Saat ini informasi tersebut masih kosong atau belum disimpan.
            </p>
            <div className="pt-1">
              <Link href="/dashboard/profile">
                <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs font-semibold bg-background">
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Lengkapi Profil di Dashboard Profile</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 4. Pengaturan Publikasi & Slug Portofolio */}
      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <span>Pengaturan Akses Portofolio</span>
          </CardTitle>
          <CardDescription>
            Konfigurasikan apakah situs publik aktif dan tentukan alamat tautan (slug) untuk pengunjung.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="space-y-5">
            {/* Saklar isPublished */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border/80 bg-muted/20">
              <div className="space-y-0.5">
                <Label htmlFor="portfolio-published-switch" className="text-sm font-semibold cursor-pointer">
                  Status Publikasi Portofolio
                </Label>
                <p className="text-xs text-muted-foreground max-w-xl">
                  {isPublished
                    ? 'Portofolio publik Anda aktif. Pengunjung luar dapat mengakses tautan portofolio dan melihat semua record yang telah ditandai Published.'
                    : 'Portofolio dalam mode draf (privat). Pengunjung publik tidak dapat mengakses portofolio Anda.'}
                </p>
              </div>
              <Switch
                id="portfolio-published-switch"
                checked={isPublished}
                onCheckedChange={setIsPublished}
                disabled={isPending}
              />
            </div>

            {/* Field Slug */}
            <div className="space-y-2">
              <Label htmlFor="portfolio-slug-input">
                Slug URL Portofolio Publik <span className="text-destructive">*</span>
              </Label>
              <div className="flex rounded-md shadow-xs">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-xs font-mono">
                  /
                </span>
                <Input
                  id="portfolio-slug-input"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().trim())}
                  placeholder="firdahana"
                  disabled={isPending}
                  className="rounded-l-none font-mono text-sm"
                  required
                />
              </div>
              {fieldErrors?.slug && (
                <p className="text-xs text-destructive">{fieldErrors.slug[0]}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Alamat web portofolio Anda. Gunakan huruf kecil, angka, dan tanda hubung (-). Contoh: <code className="text-[11px] bg-muted px-1 py-0.5 rounded">firdahana</code> atau <code className="text-[11px] bg-muted px-1 py-0.5 rounded">john-doe</code>.
              </p>
            </div>

            {/* Catatan Penjelas Flow A (PRD Rule) */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong>Prinsip Publikasi Independen (Flow A):</strong>
                <p className="mt-0.5">
                  Mengaktifkan atau menonaktifkan portofolio di atas <strong>TIDAK</strong> akan mengubah status publikasi item record apa pun. Rekaman baru selalu berstatus privat secara default. Pengunjung hanya akan melihat data yang secara eksplisit Anda tandai sebagai <em>Published</em> pada daftar di bawah.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending} className="gap-2 min-w-[140px]">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 5. Ringkasan Konten & Toggle Cepat Publikasi / Unggulan */}
      <Card className="border-border shadow-xs">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold">Ringkasan Konten Publik</CardTitle>
              <CardDescription>
                Kendali cepat publikasi dan penentuan proyek unggulan untuk semua jenis rekaman karier di satu tempat.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {data.summary.publishedRecords} Dipublikasikan
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-muted-foreground font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                {data.summary.totalRecords - data.summary.publishedRecords} Privat
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="projects" className="space-y-4">
            <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full h-auto p-1 gap-1">
              <TabsTrigger value="projects" className="gap-1.5 text-xs py-2">
                <FolderGit2 className="h-3.5 w-3.5" />
                <span>Proyek ({data.records.projects.length})</span>
              </TabsTrigger>
              <TabsTrigger value="experience" className="gap-1.5 text-xs py-2">
                <Briefcase className="h-3.5 w-3.5" />
                <span>Pengalaman ({data.records.experiences.length})</span>
              </TabsTrigger>
              <TabsTrigger value="education" className="gap-1.5 text-xs py-2">
                <GraduationCap className="h-3.5 w-3.5" />
                <span>Pendidikan ({data.records.educations.length})</span>
              </TabsTrigger>
              <TabsTrigger value="skills" className="gap-1.5 text-xs py-2">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Keahlian ({data.records.skills.length})</span>
              </TabsTrigger>
              <TabsTrigger value="certifications" className="gap-1.5 text-xs py-2">
                <Award className="h-3.5 w-3.5" />
                <span>Sertifikasi ({data.records.certifications.length})</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab Proyek */}
            <TabsContent value="projects" className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground pb-1 border-b border-border">
                <span>Daftar Proyek</span>
                <span>{data.summary.featuredProjects} Ditandai Unggulan (Featured)</span>
              </div>
              {data.records.projects.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Belum ada proyek yang terdaftar.{' '}
                  <Link href="/dashboard/projects" className="text-primary underline">
                    Tambah proyek baru
                  </Link>
                </div>
              ) : (
                data.records.projects.map(renderRecordRow)
              )}
            </TabsContent>

            {/* Tab Pengalaman */}
            <TabsContent value="experience" className="space-y-2.5 pt-2">
              <div className="text-xs text-muted-foreground pb-1 border-b border-border">
                Daftar Riwayat Karier & Organisasi
              </div>
              {data.records.experiences.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Belum ada pengalaman yang terdaftar.{' '}
                  <Link href="/dashboard/experience" className="text-primary underline">
                    Tambah pengalaman baru
                  </Link>
                </div>
              ) : (
                data.records.experiences.map(renderRecordRow)
              )}
            </TabsContent>

            {/* Tab Pendidikan */}
            <TabsContent value="education" className="space-y-2.5 pt-2">
              <div className="text-xs text-muted-foreground pb-1 border-b border-border">
                Daftar Riwayat Pendidikan Formal
              </div>
              {data.records.educations.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Belum ada pendidikan yang terdaftar.{' '}
                  <Link href="/dashboard/education" className="text-primary underline">
                    Tambah pendidikan baru
                  </Link>
                </div>
              ) : (
                data.records.educations.map(renderRecordRow)
              )}
            </TabsContent>

            {/* Tab Keahlian */}
            <TabsContent value="skills" className="space-y-2.5 pt-2">
              <div className="text-xs text-muted-foreground pb-1 border-b border-border">
                Daftar Keahlian Profesional
              </div>
              {data.records.skills.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Belum ada keahlian yang terdaftar.{' '}
                  <Link href="/dashboard/skills" className="text-primary underline">
                    Tambah skill baru
                  </Link>
                </div>
              ) : (
                data.records.skills.map(renderRecordRow)
              )}
            </TabsContent>

            {/* Tab Sertifikasi */}
            <TabsContent value="certifications" className="space-y-2.5 pt-2">
              <div className="text-xs text-muted-foreground pb-1 border-b border-border">
                Daftar Sertifikasi & Pencapaian
              </div>
              {data.records.certifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Belum ada sertifikasi yang terdaftar.{' '}
                  <Link href="/dashboard/certifications" className="text-primary underline">
                    Tambah sertifikasi baru
                  </Link>
                </div>
              ) : (
                data.records.certifications.map(renderRecordRow)
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
