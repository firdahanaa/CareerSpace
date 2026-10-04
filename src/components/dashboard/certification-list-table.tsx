'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminCertificationListItem } from '@/lib/queries/admin'
import { isCertificationExpired } from '@/lib/validation/certification'
import {
  toggleCertificationPublishedAction,
  reorderCertificationAction,
  deleteCertificationAction,
} from '@/app/(dashboard)/dashboard/certifications/actions'
import { PublishedBadge } from '@/components/dashboard/status-badge'
import { OrderControls } from '@/components/dashboard/order-controls'
import { DeleteConfirmDialog } from '@/components/dashboard/delete-confirm-dialog'
import { CertificationDialog } from '@/components/forms/certification-dialog'
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
  Award,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ClockAlert,
} from 'lucide-react'

export interface CertificationListTableProps {
  initialCertifications: AdminCertificationListItem[]
  stats: {
    total: number
    published: number
    private: number
  }
}

export function CertificationListTable({
  initialCertifications,
  stats,
}: CertificationListTableProps) {
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
  const [editTarget, setEditTarget] = useState<AdminCertificationListItem | null>(null)

  // Dialog State: Delete
  const [deleteTarget, setDeleteTarget] = useState<AdminCertificationListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filtering
  const filteredCertifications = initialCertifications.filter((item) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const matchTitle = item.title.toLowerCase().includes(q)
    const matchIssuer = item.issuer?.toLowerCase().includes(q)
    const matchId = item.credentialId?.toLowerCase().includes(q)
    const matchDesc = item.description?.toLowerCase().includes(q)
    return Boolean(matchTitle || matchIssuer || matchId || matchDesc)
  })

  const handleOpenCreate = () => {
    setEditTarget(null)
    setDialogOpen(true)
  }

  const handleOpenEdit = (item: AdminCertificationListItem) => {
    setEditTarget(item)
    setDialogOpen(true)
  }

  const handleTogglePublished = (cert: AdminCertificationListItem) => {
    setNotification(null)
    startTransition(async () => {
      const res = await toggleCertificationPublishedAction(cert.id)
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
      const res = await reorderCertificationAction(id, direction)
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

    const res = await deleteCertificationAction(deleteTarget.id)
    setIsDeleting(false)
    setDeleteTarget(null)

    if (res.success) {
      setNotification({
        type: 'success',
        message: res.message || 'Sertifikasi / pencapaian berhasil dihapus',
      })
      router.refresh()
    } else {
      setNotification({
        type: 'error',
        message: res.message || 'Gagal menghapus sertifikasi / pencapaian',
      })
    }
  }

  const formatDate = (d: Date | string) =>
    new Date(d).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Sertifikasi & Pencapaian</h1>
            <Badge variant="outline" className="text-xs font-normal">
              {stats.total} total
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola sertifikasi profesional, lisensi, penghargaan, dan pencapaian karier Anda.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span>Tambah Sertifikasi</span>
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
            placeholder="Cari sertifikasi, penerbit, nomor kredensial..."
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
        {filteredCertifications.length === 0 ? (
          <div className="p-12 text-center">
            <Award className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
            <h3 className="font-semibold text-base mb-1">
              {searchQuery ? 'Tidak ada hasil pencarian' : 'Belum ada data sertifikasi'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
              {searchQuery
                ? `Tidak ditemukan sertifikasi yang cocok dengan kata kunci "${searchQuery}".`
                : 'Mulai tambahkan sertifikasi profesional, lisensi, atau pencapaian yang pernah Anda raih.'}
            </p>
            {!searchQuery && (
              <Button onClick={handleOpenCreate} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                <span>Tambah Sertifikasi Pertama</span>
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] text-center">Urutan</TableHead>
                <TableHead>Judul & Penerbit</TableHead>
                <TableHead className="w-[200px]">Masa Berlaku</TableHead>
                <TableHead className="w-[130px] text-center">Portofolio</TableHead>
                <TableHead className="w-[100px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCertifications.map((cert, index) => {
                const isFirst = index === 0
                const isLast = index === filteredCertifications.length - 1
                const isExpired = isCertificationExpired(cert.expirationDate)

                return (
                  <TableRow key={cert.id} className="hover:bg-muted/30">
                    {/* Urutan */}
                    <TableCell className="text-center py-3">
                      <OrderControls
                        isFirst={isFirst}
                        isLast={isLast}
                        disabled={isPending || Boolean(searchQuery.trim())}
                        onMoveUp={() => handleReorder(cert.id, 'up')}
                        onMoveDown={() => handleReorder(cert.id, 'down')}
                      />
                    </TableCell>

                    {/* Judul & Penerbit */}
                    <TableCell className="py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{cert.title}</span>
                          {cert.credentialUrl && (
                            <a
                              href={cert.credentialUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-primary hover:text-primary/80 inline-flex items-center gap-0.5 text-xs font-normal"
                              title="Buka tautan verifikasi kredensial"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>Lihat</span>
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          {cert.issuer && <span>{cert.issuer}</span>}
                          {cert.credentialId && (
                            <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded-sm">
                              ID: {cert.credentialId}
                            </span>
                          )}
                        </div>

                        {cert.description && (
                          <p className="text-xs text-muted-foreground/80 line-clamp-1 italic">
                            {cert.description}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Masa Berlaku & Badge Kedaluwarsa */}
                    <TableCell className="py-3 text-xs text-muted-foreground">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                          <span>
                            {cert.issueDate ? formatDate(cert.issueDate) : '—'}
                            {cert.expirationDate && ` - ${formatDate(cert.expirationDate)}`}
                          </span>
                        </div>

                        {isExpired && (
                          <div>
                            <Badge
                              variant="destructive"
                              className="text-[11px] font-medium px-2 py-0 h-5 gap-1 bg-destructive/15 text-destructive border border-destructive/30"
                            >
                              <ClockAlert className="h-3 w-3" />
                              <span>Kedaluwarsa</span>
                            </Badge>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Status Publikasi */}
                    <TableCell className="text-center py-3">
                      <button
                        type="button"
                        onClick={() => handleTogglePublished(cert)}
                        disabled={isPending}
                        className="cursor-pointer hover:opacity-80 transition-opacity focus:outline-hidden"
                        title="Klik untuk mengubah status publikasi"
                      >
                        <PublishedBadge published={cert.published} />
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
                          onClick={() => handleOpenEdit(cert)}
                          title="Edit sertifikasi"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(cert)}
                          title="Hapus sertifikasi"
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
      <CertificationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editTarget}
        onSuccess={() => {
          setNotification({
            type: 'success',
            message: editTarget
              ? `Sertifikasi "${editTarget.title}" berhasil diperbarui.`
              : 'Sertifikasi / pencapaian baru berhasil ditambahkan.',
          })
          router.refresh()
        }}
      />

      {/* 6. Dialog Hapus */}
      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Sertifikasi / Pencapaian"
        itemName={deleteTarget?.title}
        description={
          deleteTarget?.cvSelectionsCount && deleteTarget.cvSelectionsCount > 0
            ? `Peringatan: Data ini digunakan dalam ${deleteTarget.cvSelectionsCount} konfigurasi CV. Anda harus melepaskannya dari CV terlebih dahulu sebelum dapat menghapusnya.`
            : 'Data sertifikasi ini akan dihapus secara permanen dari profil Anda.'
        }
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}
