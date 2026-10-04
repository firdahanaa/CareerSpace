'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { AdminExperienceListItem } from '@/lib/queries/admin'
import {
  EXPERIENCE_CATEGORY_LABELS,
  type ExperienceCategoryValue,
} from '@/lib/validation/experience'
import {
  toggleExperiencePublishedAction,
  reorderExperienceAction,
  deleteExperienceAction,
} from '@/app/(dashboard)/dashboard/experience/actions'
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
  Briefcase,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

export interface ExperienceListTableProps {
  initialExperiences: AdminExperienceListItem[]
  stats: {
    total: number
    published: number
    private: number
    categoryCounts: Record<string, number>
  }
}

export function ExperienceListTable({
  initialExperiences,
  stats,
}: ExperienceListTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')

  // Notification Banner
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Delete Dialog state
  const [deleteTarget, setDeleteTarget] = useState<AdminExperienceListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filtering
  const filteredExperiences = initialExperiences.filter((item) => {
    // 1. Category Filter
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
      return false
    }

    // 2. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchOrg = item.organization.toLowerCase().includes(q)
      const matchPos = item.position.toLowerCase().includes(q)
      const matchLoc = item.location?.toLowerCase().includes(q)
      const matchDesc = item.description?.toLowerCase().includes(q)
      const matchSkill = item.skills.some((s) => s.skill.name.toLowerCase().includes(q))
      if (!matchOrg && !matchPos && !matchLoc && !matchDesc && !matchSkill) {
        return false
      }
    }

    return true
  })

  const handleTogglePublished = (exp: AdminExperienceListItem) => {
    setNotification(null)
    startTransition(async () => {
      const res = await toggleExperiencePublishedAction(exp.id)
      if (res.success) {
        setNotification({ type: 'success', message: res.message || 'Status publikasi diperbarui' })
        router.refresh()
      } else {
        setNotification({ type: 'error', message: res.message || 'Gagal mengubah status publikasi' })
      }
    })
  }

  const handleReorder = (id: string, direction: 'up' | 'down') => {
    setNotification(null)
    startTransition(async () => {
      const res = await reorderExperienceAction(id, direction)
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

    const res = await deleteExperienceAction(deleteTarget.id)
    setIsDeleting(false)
    setDeleteTarget(null)

    if (res.success) {
      setNotification({ type: 'success', message: res.message || 'Pengalaman berhasil dihapus' })
      router.refresh()
    } else {
      setNotification({ type: 'error', message: res.message || 'Gagal menghapus pengalaman' })
    }
  }

  const formatTimeline = (exp: AdminExperienceListItem) => {
    if (exp.isCurrent) {
      if (exp.startDate) {
        const start = new Date(exp.startDate).toLocaleDateString('id-ID', {
          month: 'short',
          year: 'numeric',
        })
        return `${start} - Sekarang`
      }
      return 'Saat Ini (Aktif)'
    }

    if (exp.startDate && exp.endDate) {
      const start = new Date(exp.startDate).toLocaleDateString('id-ID', {
        month: 'short',
        year: 'numeric',
      })
      const end = new Date(exp.endDate).toLocaleDateString('id-ID', {
        month: 'short',
        year: 'numeric',
      })
      return `${start} - ${end}`
    }

    if (exp.startDate) {
      return new Date(exp.startDate).toLocaleDateString('id-ID', {
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Pengalaman</h1>
          <p className="text-sm text-muted-foreground">
            Kelola rekam jejak pekerjaan, magang, organisasi, kerja sukarela, dan freelance Anda.
          </p>
        </div>

        <Link
          href="/dashboard/experience/new"
          className={cn(
            buttonVariants({ variant: 'default' }),
            'gap-2 shrink-0 self-start sm:self-auto cursor-pointer'
          )}
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Pengalaman</span>
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

      {/* Search & Category Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari organisasi, posisi, atau skill..."
            className="pl-9 h-9"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              categoryFilter === 'ALL'
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'bg-background hover:bg-muted text-muted-foreground border-border'
            }`}
          >
            Semua ({stats.categoryCounts.ALL || 0})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('EMPLOYMENT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              categoryFilter === 'EMPLOYMENT'
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'bg-background hover:bg-muted text-muted-foreground border-border'
            }`}
          >
            Pekerjaan ({stats.categoryCounts.EMPLOYMENT || 0})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('INTERNSHIP')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              categoryFilter === 'INTERNSHIP'
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'bg-background hover:bg-muted text-muted-foreground border-border'
            }`}
          >
            Magang ({stats.categoryCounts.INTERNSHIP || 0})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('ORGANIZATION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              categoryFilter === 'ORGANIZATION'
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'bg-background hover:bg-muted text-muted-foreground border-border'
            }`}
          >
            Organisasi ({stats.categoryCounts.ORGANIZATION || 0})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('VOLUNTEERING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              categoryFilter === 'VOLUNTEERING'
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'bg-background hover:bg-muted text-muted-foreground border-border'
            }`}
          >
            Sukarelawan ({stats.categoryCounts.VOLUNTEERING || 0})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('FREELANCE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              categoryFilter === 'FREELANCE'
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'bg-background hover:bg-muted text-muted-foreground border-border'
            }`}
          >
            Freelance ({stats.categoryCounts.FREELANCE || 0})
          </button>
        </div>
      </div>

      {/* Experience Table */}
      {filteredExperiences.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl bg-muted/10 space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Briefcase className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground">
              {searchQuery || categoryFilter !== 'ALL'
                ? 'Tidak ada pengalaman yang sesuai dengan kriteria'
                : 'Belum ada pengalaman yang ditambahkan'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {searchQuery || categoryFilter !== 'ALL'
                ? 'Coba sesuaikan kata kunci pencarian atau ubah filter kategori yang aktif.'
                : 'Mulai dokumentasikan riwayat karier dan organisasi Anda untuk ditampilkan di portofolio dan CV.'}
            </p>
          </div>
          {searchQuery || categoryFilter !== 'ALL' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setCategoryFilter('ALL')
              }}
            >
              Reset Filter
            </Button>
          ) : (
            <Link
              href="/dashboard/experience/new"
              className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'gap-2 cursor-pointer')}
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Pengalaman Pertama</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-card shadow-xs">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-16 text-center">Urutan</TableHead>
                <TableHead className="min-w-[260px]">Peran & Organisasi</TableHead>
                <TableHead className="hidden md:table-cell">Kategori</TableHead>
                <TableHead className="hidden lg:table-cell">Periode</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-24 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExperiences.map((exp, index) => {
                const isFirst = index === 0
                const isLast = index === filteredExperiences.length - 1

                return (
                  <TableRow key={exp.id} className="group hover:bg-muted/20">
                    {/* 1. Reorder Controls */}
                    <TableCell className="text-center align-middle">
                      <OrderControls
                        onMoveUp={() => handleReorder(exp.id, 'up')}
                        onMoveDown={() => handleReorder(exp.id, 'down')}
                        isFirst={isFirst}
                        isLast={isLast}
                        disabled={isPending}
                      />
                    </TableCell>

                    {/* 2. Position & Organization */}
                    <TableCell className="align-top py-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/experience/${exp.id}/edit`}
                            className="font-semibold text-foreground hover:text-primary transition-colors truncate"
                          >
                            {exp.position}
                          </Link>
                          <span className="text-muted-foreground text-xs font-normal">
                            di <strong className="font-semibold text-foreground">{exp.organization}</strong>
                          </span>
                        </div>

                        {exp.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{exp.location}</span>
                          </div>
                        )}

                        {exp.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 pt-0.5">
                            {exp.description}
                          </p>
                        )}

                        {/* Associated Skills Badges */}
                        {exp.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {exp.skills.map((s) => (
                              <Badge
                                key={s.skill.id}
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 font-normal bg-primary/10 text-primary border-primary/20"
                              >
                                {s.skill.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* 3. Category */}
                    <TableCell className="hidden md:table-cell align-top py-3 text-xs">
                      <Badge variant="outline" className="font-normal text-muted-foreground bg-muted/20">
                        {EXPERIENCE_CATEGORY_LABELS[exp.category as ExperienceCategoryValue] || exp.category}
                      </Badge>
                    </TableCell>

                    {/* 4. Timeline / Dates */}
                    <TableCell className="hidden lg:table-cell align-top py-3 text-xs text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                        <span>{formatTimeline(exp)}</span>
                      </div>
                    </TableCell>

                    {/* 5. Published Status Toggle */}
                    <TableCell className="align-top py-3">
                      <button
                        type="button"
                        onClick={() => handleTogglePublished(exp)}
                        disabled={isPending}
                        className="cursor-pointer group/btn flex flex-col items-start gap-1"
                        title={
                          exp.published
                            ? 'Klik untuk mengubah status menjadi Privat'
                            : 'Klik untuk mempublikasikan ke portofolio'
                        }
                      >
                        <PublishedBadge published={exp.published} />
                        <span className="text-[10px] text-muted-foreground group-hover/btn:underline">
                          {exp.published ? 'Publik' : 'Privat'}
                        </span>
                      </button>
                    </TableCell>

                    {/* 6. Action Edit & Delete */}
                    <TableCell className="align-top py-3 text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/experience/${exp.id}/edit`}
                          className={cn(
                            buttonVariants({ variant: 'ghost', size: 'icon' }),
                            'h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer'
                          )}
                          title="Edit Pengalaman"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                          onClick={() => setDeleteTarget(exp)}
                          title="Hapus Pengalaman"
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

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Pengalaman"
        itemName={deleteTarget ? `${deleteTarget.position} di ${deleteTarget.organization}` : ''}
        description={
          deleteTarget?.cvSelectionsCount && deleteTarget.cvSelectionsCount > 0
            ? `Peringatan: Pengalaman ini sedang digunakan pada ${deleteTarget.cvSelectionsCount} konfigurasi CV. Anda harus melepaskannya dari CV terlebih dahulu sebelum dapat menghapusnya.`
            : 'Tindakan ini akan menghapus rekam jejak pengalaman ini secara permanen dari sistem identitas karier Anda.'
        }
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}
