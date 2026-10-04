'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminEducationListItem } from '@/lib/queries/admin'
import {
  toggleEducationPublishedAction,
  reorderEducationAction,
  deleteEducationAction,
} from '@/app/(dashboard)/dashboard/education/actions'
import { PublishedBadge } from '@/components/dashboard/status-badge'
import { OrderControls } from '@/components/dashboard/order-controls'
import { DeleteConfirmDialog } from '@/components/dashboard/delete-confirm-dialog'
import { EducationDialog } from '@/components/forms/education-dialog'
import { Button } from '@/components/ui/button'
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
  GraduationCap,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Award,
} from 'lucide-react'

export interface EducationListTableProps {
  initialEducations: AdminEducationListItem[]
  stats: {
    total: number
    published: number
    private: number
  }
}

export function EducationListTable({
  initialEducations,
  stats,
}: EducationListTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Notification Banner
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Dialog State: Create / Edit
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AdminEducationListItem | null>(null)

  // Dialog State: Delete
  const [deleteTarget, setDeleteTarget] = useState<AdminEducationListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filtering
  const filteredEducations = initialEducations.filter((item) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const matchInst = item.institution.toLowerCase().includes(q)
    const matchDegree = item.degree?.toLowerCase().includes(q)
    const matchField = item.fieldOfStudy?.toLowerCase().includes(q)
    const matchDesc = item.description?.toLowerCase().includes(q)
    const matchGpa = item.gpa?.toLowerCase().includes(q)
    return Boolean(matchInst || matchDegree || matchField || matchDesc || matchGpa)
  })

  const handleOpenCreate = () => {
    setEditTarget(null)
    setDialogOpen(true)
  }

  const handleOpenEdit = (item: AdminEducationListItem) => {
    setEditTarget(item)
    setDialogOpen(true)
  }

  const handleTogglePublished = (edu: AdminEducationListItem) => {
    setNotification(null)
    startTransition(async () => {
      const res = await toggleEducationPublishedAction(edu.id)
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
      const res = await reorderEducationAction(id, direction)
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

    const res = await deleteEducationAction(deleteTarget.id)
    setIsDeleting(false)
    setDeleteTarget(null)

    if (res.success) {
      setNotification({ type: 'success', message: res.message || 'Pendidikan berhasil dihapus' })
      router.refresh()
    } else {
      setNotification({ type: 'error', message: res.message || 'Gagal menghapus data pendidikan' })
    }
  }

  const formatTimeline = (edu: AdminEducationListItem) => {
    const formatDate = (d: Date) =>
      new Date(d).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })

    if (edu.isCurrent) {
      if (edu.startDate) {
        return `${formatDate(edu.startDate)} - Sekarang`
      }
      return 'Sedang Berjalan'
    }

    if (edu.startDate && edu.endDate) {
      return `${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}`
    }

    if (edu.endDate) {
      return `Lulus ${formatDate(edu.endDate)}`
    }

    if (edu.startDate) {
      return `Mulai ${formatDate(edu.startDate)}`
    }

    return '—'
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Pendidikan</h1>
            <Badge variant="outline" className="text-xs font-normal">
              {stats.total} total
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola riwayat pendidikan formal, gelar, institusi, dan pencapaian akademik.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span>Tambah Pendidikan</span>
        </Button>
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

      {/* 3. Search & Stats Overview */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari institusi, gelar, jurusan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {stats.published} Published
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-muted-foreground font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            {stats.private} Private
          </span>
        </div>
      </div>

      {/* 4. Table List */}
      <div className="rounded-lg border bg-card">
        {filteredEducations.length === 0 ? (
          <div className="p-12 text-center">
            <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
            <h3 className="font-semibold text-base mb-1">
              {searchQuery ? 'Tidak ada hasil pencarian' : 'Belum ada data pendidikan'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
              {searchQuery
                ? `Tidak ditemukan data pendidikan yang cocok dengan kata kunci "${searchQuery}".`
                : 'Mulai tambahkan riwayat perguruan tinggi, sekolah, atau gelar akademik Anda.'}
            </p>
            {!searchQuery && (
              <Button onClick={handleOpenCreate} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                <span>Tambah Pendidikan Pertama</span>
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] text-center">Urutan</TableHead>
                <TableHead>Institusi & Gelar</TableHead>
                <TableHead className="w-[180px]">Periode Studi</TableHead>
                <TableHead className="w-[130px] text-center">Portofolio</TableHead>
                <TableHead className="w-[100px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEducations.map((edu, index) => {
                const isFirst = index === 0
                const isLast = index === filteredEducations.length - 1

                return (
                  <TableRow key={edu.id} className="hover:bg-muted/30">
                    {/* Urutan */}
                    <TableCell className="text-center py-3">
                      <OrderControls
                        isFirst={isFirst}
                        isLast={isLast}
                        disabled={isPending || Boolean(searchQuery.trim())}
                        onMoveUp={() => handleReorder(edu.id, 'up')}
                        onMoveDown={() => handleReorder(edu.id, 'down')}
                      />
                    </TableCell>

                    {/* Institusi, Gelar & Bidang Studi */}
                    <TableCell className="py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{edu.institution}</span>
                          {edu.gpa && (
                            <Badge
                              variant="secondary"
                              className="text-[11px] font-medium px-2 py-0 h-5 gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                            >
                              <Award className="h-3 w-3" />
                              <span>{edu.gpa}</span>
                            </Badge>
                          )}
                        </div>

                        {(edu.degree || edu.fieldOfStudy) && (
                          <p className="text-xs text-muted-foreground">
                            {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(' • ')}
                          </p>
                        )}

                        {edu.description && (
                          <p className="text-xs text-muted-foreground/80 line-clamp-1 italic">
                            {edu.description}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Periode */}
                    <TableCell className="py-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                        <span>{formatTimeline(edu)}</span>
                      </div>
                    </TableCell>

                    {/* Status Publikasi */}
                    <TableCell className="text-center py-3">
                      <button
                        type="button"
                        onClick={() => handleTogglePublished(edu)}
                        disabled={isPending}
                        className="cursor-pointer hover:opacity-80 transition-opacity focus:outline-hidden"
                        title="Klik untuk mengubah status publikasi"
                      >
                        <PublishedBadge published={edu.published} />
                      </button>
                    </TableCell>

                    {/* Aksi Edit & Hapus */}
                    <TableCell className="text-right py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleOpenEdit(edu)}
                          title="Edit pendidikan"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(edu)}
                          title="Hapus pendidikan"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* 5. Dialog Create / Edit */}
      <EducationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editTarget}
        onSuccess={() => {
          setNotification({
            type: 'success',
            message: editTarget
              ? `Pendidikan "${editTarget.institution}" berhasil diperbarui.`
              : 'Pendidikan baru berhasil ditambahkan.',
          })
          router.refresh()
        }}
      />

      {/* 6. Dialog Hapus */}
      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Data Pendidikan"
        itemName={deleteTarget?.institution}
        description={
          deleteTarget?.cvSelectionsCount && deleteTarget.cvSelectionsCount > 0
            ? `Peringatan: Data ini digunakan dalam ${deleteTarget.cvSelectionsCount} konfigurasi CV. Anda harus melepaskannya dari CV terlebih dahulu sebelum dapat menghapusnya.`
            : 'Data pendidikan ini akan dihapus secara permanen dari profil Anda.'
        }
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}
