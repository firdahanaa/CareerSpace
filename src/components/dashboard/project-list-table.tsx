'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { AdminProjectListItem } from '@/lib/queries/admin'
import { PROJECT_TYPE_LABELS, type ProjectTypeValue } from '@/lib/validation/project'
import {
  toggleProjectPublishedAction,
  toggleProjectFeaturedAction,
  reorderProjectAction,
  deleteProjectAction,
} from '@/app/(dashboard)/dashboard/projects/actions'
import { PublishedBadge } from '@/components/dashboard/status-badge'
import { OrderControls } from '@/components/dashboard/order-controls'
import { DeleteConfirmDialog } from '@/components/dashboard/delete-confirm-dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Sparkles,
  AlertCircle,
  FolderGit2,
  Calendar,
  CheckCircle2,
} from 'lucide-react'

export interface ProjectListTableProps {
  initialProjects: AdminProjectListItem[]
  stats: {
    total: number
    published: number
    private: number
    featured: number
  }
}

export function ProjectListTable({ initialProjects, stats }: ProjectListTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // State pencarian & filter
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'private' | 'featured'>('all')

  // Notification Banner
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Dialog konfirmasi hapus
  const [deleteTarget, setDeleteTarget] = useState<AdminProjectListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Client-side search and filtering
  const filteredProjects = initialProjects.filter((project) => {
    // 1. Status Filter
    if (statusFilter === 'published' && !project.published) return false
    if (statusFilter === 'private' && project.published) return false
    if (statusFilter === 'featured' && !project.featured) return false

    // 2. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchTitle = project.title.toLowerCase().includes(q)
      const matchSummary = project.shortSummary.toLowerCase().includes(q)
      const matchTech = project.technologies.some((t) => t.toLowerCase().includes(q))
      const matchSkill = project.skills.some((s) => s.skill.name.toLowerCase().includes(q))
      if (!matchTitle && !matchSummary && !matchTech && !matchSkill) return false
    }

    return true
  })

  // Action handlers
  const handleTogglePublished = (project: AdminProjectListItem) => {
    setNotification(null)
    startTransition(async () => {
      const res = await toggleProjectPublishedAction(project.id)
      if (res.success) {
        setNotification({ type: 'success', message: res.message || 'Status berhasil diperbarui' })
        router.refresh()
      } else {
        setNotification({ type: 'error', message: res.message || 'Gagal mengubah status publikasi' })
      }
    })
  }

  const handleToggleFeatured = (project: AdminProjectListItem) => {
    setNotification(null)
    if (!project.published) {
      setNotification({
        type: 'error',
        message: 'Proyek privat tidak dapat dijadikan Featured. Publikasikan proyek terlebih dahulu.',
      })
      return
    }

    startTransition(async () => {
      const res = await toggleProjectFeaturedAction(project.id)
      if (res.success) {
        setNotification({ type: 'success', message: res.message || 'Status featured diperbarui' })
        router.refresh()
      } else {
        setNotification({ type: 'error', message: res.message || 'Gagal mengubah status featured' })
      }
    })
  }

  const handleReorder = (id: string, direction: 'up' | 'down') => {
    setNotification(null)
    startTransition(async () => {
      const res = await reorderProjectAction(id, direction)
      if (res.success) {
        router.refresh()
      } else {
        setNotification({ type: 'error', message: res.message || 'Gagal mengubah urutan' })
      }
    })
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    setNotification(null)

    const res = await deleteProjectAction(deleteTarget.id)
    setIsDeleting(false)
    setDeleteTarget(null)

    if (res.success) {
      setNotification({ type: 'success', message: res.message || 'Proyek berhasil dihapus' })
      router.refresh()
    } else {
      setNotification({ type: 'error', message: res.message || 'Gagal menghapus proyek' })
    }
  }

  const formatTimeline = (project: AdminProjectListItem) => {
    if (project.isOngoing) {
      if (project.startDate) {
        const start = new Date(project.startDate).toLocaleDateString('id-ID', {
          month: 'short',
          year: 'numeric',
        })
        return `${start} - Sekarang`
      }
      return 'Sedang Berlangsung'
    }

    if (project.startDate && project.endDate) {
      const start = new Date(project.startDate).toLocaleDateString('id-ID', {
        month: 'short',
        year: 'numeric',
      })
      const end = new Date(project.endDate).toLocaleDateString('id-ID', {
        month: 'short',
        year: 'numeric',
      })
      return `${start} - ${end}`
    }

    if (project.startDate) {
      return new Date(project.startDate).toLocaleDateString('id-ID', {
        month: 'short',
        year: 'numeric',
      })
    }

    return '-'
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Daftar Proyek</h1>
          <p className="text-sm text-muted-foreground">
            Kelola proyek portofolio dan resume karier Anda. Data disimpan satu kali untuk portofolio publik dan CV.
          </p>
        </div>

        <Link
          href="/dashboard/projects/new"
          className={cn(
            buttonVariants({ variant: 'default' }),
            'gap-2 shrink-0 self-start sm:self-auto cursor-pointer'
          )}
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Proyek</span>
        </Link>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border text-sm ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul, teknologi, atau skill..."
            className="pl-9 h-9"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'bg-background hover:bg-muted text-muted-foreground border-border'
            }`}
          >
            Semua ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === 'published'
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'bg-background hover:bg-muted text-muted-foreground border-border'
            }`}
          >
            Published ({stats.published})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('private')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === 'private'
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'bg-background hover:bg-muted text-muted-foreground border-border'
            }`}
          >
            Private ({stats.private})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('featured')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === 'featured'
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'bg-background hover:bg-muted text-muted-foreground border-border'
            }`}
          >
            Featured ({stats.featured})
          </button>
        </div>
      </div>

      {/* Projects Table */}
      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl bg-muted/10 space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FolderGit2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground">
              {searchQuery || statusFilter !== 'all'
                ? 'Tidak ada proyek yang sesuai dengan kriteria'
                : 'Belum ada proyek yang ditambahkan'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {searchQuery || statusFilter !== 'all'
                ? 'Coba sesuaikan kata kunci pencarian atau ubah filter status yang aktif.'
                : 'Mulai dokumentasikan karya, repositori, dan aplikasi Anda untuk ditampilkan di portofolio dan CV.'}
            </p>
          </div>
          {searchQuery || statusFilter !== 'all' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
              }}
            >
              Reset Filter
            </Button>
          ) : (
            <Link
              href="/dashboard/projects/new"
              className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'gap-2 cursor-pointer')}
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Proyek Pertama</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-card shadow-xs">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-16 text-center">Urutan</TableHead>
                <TableHead className="min-w-[260px]">Proyek</TableHead>
                <TableHead className="hidden md:table-cell">Tipe</TableHead>
                <TableHead className="hidden lg:table-cell">Periode</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-24 text-center">Featured</TableHead>
                <TableHead className="w-24 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project, index) => {
                const isFirst = index === 0
                const isLast = index === filteredProjects.length - 1

                return (
                  <TableRow key={project.id} className="group hover:bg-muted/20">
                    {/* 1. Reorder Controls (DATA-06) */}
                    <TableCell className="text-center align-middle">
                      <OrderControls
                        onMoveUp={() => handleReorder(project.id, 'up')}
                        onMoveDown={() => handleReorder(project.id, 'down')}
                        isFirst={isFirst}
                        isLast={isLast}
                        disabled={isPending}
                      />
                    </TableCell>

                    {/* 2. Project Title, Short Summary, & Cover */}
                    <TableCell className="align-top py-3">
                      <div className="flex gap-3">
                        {project.coverImageUrl ? (
                          <div className="relative h-12 w-16 rounded-md overflow-hidden border border-border shrink-0 bg-muted">
                            <Image
                              src={project.coverImageUrl}
                              alt={project.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-16 rounded-md border border-border bg-muted/30 flex items-center justify-center shrink-0 text-muted-foreground/60">
                            <FolderGit2 className="h-5 w-5" />
                          </div>
                        )}

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/dashboard/projects/${project.id}/edit`}
                              className="font-semibold text-foreground hover:text-primary transition-colors truncate"
                            >
                              {project.title}
                            </Link>
                            <span className="text-[11px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded-sm shrink-0">
                              /{project.slug}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {project.shortSummary}
                          </p>

                          {/* Skill & Technology Pills */}
                          {(project.skills.length > 0 || project.technologies.length > 0) && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {project.skills.slice(0, 3).map((s) => (
                                <Badge
                                  key={s.skill.id}
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0 font-normal bg-primary/10 text-primary border-primary/20"
                                >
                                  {s.skill.name}
                                </Badge>
                              ))}
                              {project.technologies.slice(0, 3).map((t) => (
                                <Badge
                                  key={t}
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground"
                                >
                                  {t}
                                </Badge>
                              ))}
                              {project.skills.length + project.technologies.length > 6 && (
                                <span className="text-[10px] text-muted-foreground self-center">
                                  +{project.skills.length + project.technologies.length - 6} lainnya
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* 3. Tipe Proyek */}
                    <TableCell className="hidden md:table-cell align-top py-3 text-xs">
                      {project.projectType ? (
                        <span className="inline-block px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                          {PROJECT_TYPE_LABELS[project.projectType as ProjectTypeValue] || project.projectType}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    {/* 4. Timeline / Dates */}
                    <TableCell className="hidden lg:table-cell align-top py-3 text-xs text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                        <span>{formatTimeline(project)}</span>
                      </div>
                    </TableCell>

                    {/* 5. Published Status Toggle (DATA-04) */}
                    <TableCell className="align-top py-3">
                      <button
                        type="button"
                        onClick={() => handleTogglePublished(project)}
                        disabled={isPending}
                        className="cursor-pointer group/btn flex flex-col items-start gap-1"
                        title={
                          project.published
                            ? 'Klik untuk mengubah status menjadi Privat'
                            : 'Klik untuk mempublikasikan proyek ke portofolio'
                        }
                      >
                        <PublishedBadge published={project.published} />
                        <span className="text-[10px] text-muted-foreground group-hover/btn:underline">
                          {project.published ? 'Publik' : 'Privat'}
                        </span>
                      </button>
                    </TableCell>

                    {/* 6. Featured Status Toggle (DATA-05) */}
                    <TableCell className="align-top py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(project)}
                        disabled={isPending || !project.published}
                        className={`inline-flex items-center justify-center p-1.5 rounded-lg border transition-all cursor-pointer ${
                          project.featured
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                            : 'bg-background hover:bg-muted border-border text-muted-foreground/50'
                        } ${!project.published ? 'opacity-30 cursor-not-allowed' : ''}`}
                        title={
                          !project.published
                            ? 'Harus Published untuk dijadikan Featured'
                            : project.featured
                            ? 'Hapus status Featured'
                            : 'Jadikan Proyek Featured'
                        }
                        aria-label="Toggle Featured"
                      >
                        <Sparkles
                          className={`h-4 w-4 ${project.featured ? 'fill-current' : ''}`}
                        />
                      </button>
                    </TableCell>

                    {/* 7. Action Edit & Delete */}
                    <TableCell className="align-top py-3 text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/projects/${project.id}/edit`}
                          className={cn(
                            buttonVariants({ variant: 'ghost', size: 'icon' }),
                            'h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer'
                          )}
                          title="Edit Proyek"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                          onClick={() => setDeleteTarget(project)}
                          title="Hapus Proyek"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Reusable Delete Confirmation Dialog (DATA-07) */}
      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Proyek"
        itemName={deleteTarget?.title}
        description={
          deleteTarget?.cvSelectionsCount && deleteTarget.cvSelectionsCount > 0
            ? `Peringatan: Proyek ini sedang digunakan pada ${deleteTarget.cvSelectionsCount} konfigurasi CV. Anda harus melepaskannya dari CV terlebih dahulu sebelum dapat menghapusnya.`
            : 'Tindakan ini akan menghapus proyek dan gambar sampul secara permanen dari sistem identitas karier Anda.'
        }
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}
