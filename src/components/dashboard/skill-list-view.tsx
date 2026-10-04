'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminSkillsGroup, AdminSkillListItem } from '@/lib/queries/admin'
import {
  PROFICIENCY_LEVEL_LABELS,
  type ProficiencyLevelValue,
  type SkillCategoryValue,
} from '@/lib/validation/skill'
import {
  toggleSkillPublishedAction,
  reorderSkillAction,
  deleteSkillAction,
} from '@/app/(dashboard)/dashboard/skills/actions'
import { SkillDialog } from '@/components/forms/skill-dialog'
import { PublishedBadge } from '@/components/dashboard/status-badge'
import { OrderControls } from '@/components/dashboard/order-controls'
import { DeleteConfirmDialog } from '@/components/dashboard/delete-confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Info,
  FolderGit2,
  Briefcase,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

export interface SkillListViewProps {
  groups: AdminSkillsGroup[]
  stats: {
    total: number
    published: number
    private: number
  }
}

export function SkillListView({ groups, stats }: SkillListViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Dialog Add/Edit State
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AdminSkillListItem | null>(null)
  const [dialogCategory, setDialogCategory] = useState<SkillCategoryValue>('TECHNICAL')

  // Notification Banner
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Delete Dialog State
  const [deleteTarget, setDeleteTarget] = useState<AdminSkillListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleOpenAdd = (category: SkillCategoryValue = 'TECHNICAL') => {
    setEditTarget(null)
    setDialogCategory(category)
    setDialogOpen(true)
  }

  const handleOpenEdit = (skill: AdminSkillListItem) => {
    setEditTarget(skill)
    setDialogCategory(skill.category as SkillCategoryValue)
    setDialogOpen(true)
  }

  const handleTogglePublished = (skill: AdminSkillListItem) => {
    setNotification(null)
    startTransition(async () => {
      const res = await toggleSkillPublishedAction(skill.id)
      if (res.success) {
        setNotification({ type: 'success', message: res.message || 'Status publikasi diperbarui' })
        router.refresh()
      } else {
        setNotification({ type: 'error', message: res.message || 'Gagal mengubah status' })
      }
    })
  }

  const handleReorder = (id: string, direction: 'up' | 'down') => {
    setNotification(null)
    startTransition(async () => {
      const res = await reorderSkillAction(id, direction)
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

    const res = await deleteSkillAction(deleteTarget.id)
    setIsDeleting(false)
    setDeleteTarget(null)

    if (res.success) {
      setNotification({ type: 'success', message: res.message || 'Skill berhasil dihapus' })
      router.refresh()
    } else {
      setNotification({ type: 'error', message: res.message || 'Gagal menghapus skill' })
    }
  }

  // Filter skills based on search query
  const query = searchQuery.trim().toLowerCase()
  const filteredGroups = groups.map((grp) => ({
    ...grp,
    skills: grp.skills.filter((s) => {
      if (!query) return true
      return (
        s.name.toLowerCase().includes(query) ||
        grp.label.toLowerCase().includes(query) ||
        (s.proficiency && s.proficiency.toLowerCase().includes(query))
      )
    }),
  }))

  const totalFilteredSkills = filteredGroups.reduce((acc, g) => acc + g.skills.length, 0)

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Kelola Skill</h1>
          <p className="text-sm text-muted-foreground">
            Daftar keahlian profesional yang dihubungkan ke proyek dan riwayat pengalaman Anda.
          </p>
        </div>

        <Button
          onClick={() => handleOpenAdd('TECHNICAL')}
          className="gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Skill</span>
        </Button>
      </div>

      {/* PRD 5.5 Catatan Penting Penilaian Diri */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-300 text-xs leading-relaxed">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
        <div>
          <span className="font-semibold">Catatan Kualifikasi (PRD 5.5):</span> Tingkat kemampuan
          (proficiency level) bersifat penilaian mandiri (<em>self-assessed</em>) dan aplikasi tidak
          menampilkannya sebagai kualifikasi yang terverifikasi secara objektif kepada publik atau
          perekrut.
        </div>
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

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama skill atau kategori..."
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="px-2.5 py-1 rounded-md bg-muted font-medium">
            Total: <strong className="text-foreground">{stats.total}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">
            Published: <strong>{stats.published}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-muted text-muted-foreground font-medium">
            Private: <strong>{stats.private}</strong>
          </span>
        </div>
      </div>

      {/* Groups per Category */}
      {totalFilteredSkills === 0 && searchQuery ? (
        <div className="p-8 text-center border border-dashed rounded-xl bg-muted/10 space-y-3">
          <p className="text-sm text-muted-foreground">
            Tidak ada skill yang cocok dengan pencarian &ldquo;{searchQuery}&rdquo;.
          </p>
          <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
            Reset Pencarian
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredGroups.map((group) => {
            const hasSkills = group.skills.length > 0

            return (
              <Card key={group.category} className="overflow-hidden border-border/70 shadow-xs">
                <CardHeader className="bg-muted/30 py-3 px-4 border-b border-border/50 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold text-foreground">
                      {group.label}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs px-2 py-0 font-normal">
                      {group.skills.length} skill
                    </Badge>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenAdd(group.category as SkillCategoryValue)}
                    className="h-8 gap-1 text-xs cursor-pointer hover:bg-background"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah</span>
                  </Button>
                </CardHeader>

                <CardContent className="p-0">
                  {!hasSkills ? (
                    <div className="py-6 px-4 text-center text-xs text-muted-foreground">
                      Belum ada skill dalam kategori ini.{' '}
                      <button
                        type="button"
                        onClick={() => handleOpenAdd(group.category as SkillCategoryValue)}
                        className="text-primary underline underline-offset-2 hover:opacity-80 cursor-pointer font-medium"
                      >
                        Tambah skill sekarang
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {group.skills.map((skill, index) => {
                        const isFirst = index === 0
                        const isLast = index === group.skills.length - 1

                        return (
                          <div
                            key={skill.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:px-4 hover:bg-muted/15 transition-colors"
                          >
                            {/* Left: Reorder & Name */}
                            <div className="flex items-center gap-3 min-w-0">
                              <OrderControls
                                onMoveUp={() => handleReorder(skill.id, 'up')}
                                onMoveDown={() => handleReorder(skill.id, 'down')}
                                isFirst={isFirst}
                                isLast={isLast}
                                disabled={isPending}
                              />

                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-foreground truncate">
                                    {skill.name}
                                  </span>
                                  {skill.proficiency && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground bg-muted/30 shrink-0"
                                      title="Penilaian mandiri (self-assessed)"
                                    >
                                      {PROFICIENCY_LEVEL_LABELS[
                                        skill.proficiency as ProficiencyLevelValue
                                      ] || skill.proficiency}
                                    </Badge>
                                  )}
                                </div>

                                {/* Linked Projects & Experiences Counts */}
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span
                                    className="flex items-center gap-1"
                                    title={`${skill.projectsCount} proyek memakai skill ini`}
                                  >
                                    <FolderGit2 className="h-3 w-3 text-muted-foreground/70" />
                                    <span>{skill.projectsCount} proyek</span>
                                  </span>
                                  <span
                                    className="flex items-center gap-1"
                                    title={`${skill.experiencesCount} pengalaman memakai skill ini`}
                                  >
                                    <Briefcase className="h-3 w-3 text-muted-foreground/70" />
                                    <span>{skill.experiencesCount} pengalaman</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Right: Published Toggle & Actions */}
                            <div className="flex items-center gap-3 self-end sm:self-center">
                              {/* Toggle Published */}
                              <button
                                type="button"
                                onClick={() => handleTogglePublished(skill)}
                                disabled={isPending}
                                className="cursor-pointer group/btn"
                                title={
                                  skill.published
                                    ? 'Klik untuk mengubah menjadi Privat'
                                    : 'Klik untuk mempublikasikan skill ini'
                                }
                              >
                                <PublishedBadge published={skill.published} />
                              </button>

                              {/* Edit & Delete Action Buttons */}
                              <div className="inline-flex items-center gap-1 border-l border-border pl-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                                  onClick={() => handleOpenEdit(skill)}
                                  title="Edit Skill"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                  onClick={() => setDeleteTarget(skill)}
                                  title="Hapus Skill"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add / Edit Skill Modal Dialog */}
      <SkillDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editTarget}
        defaultCategory={dialogCategory}
        onSuccess={() => {
          setNotification({
            type: 'success',
            message: editTarget ? 'Skill berhasil diperbarui.' : 'Skill baru berhasil ditambahkan.',
          })
          router.refresh()
        }}
      />

      {/* Reusable Delete Confirmation Dialog (DATA-07 & PRD 5.5) */}
      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Skill"
        itemName={deleteTarget?.name}
        description={
          deleteTarget?.cvSelectionsCount && deleteTarget.cvSelectionsCount > 0
            ? `Peringatan: Skill ini sedang digunakan pada ${deleteTarget.cvSelectionsCount} konfigurasi CV. Anda harus melepaskannya dari CV terlebih dahulu sebelum dapat menghapusnya.`
            : deleteTarget?.projectsCount || deleteTarget?.experiencesCount
            ? `Skill ini saat ini terhubung dengan ${deleteTarget.projectsCount || 0} proyek dan ${
                deleteTarget.experiencesCount || 0
              } pengalaman kerja. Menghapus skill ini akan melepaskan keterkaitan tersebut secara aman. Tindakan ini tidak dapat dibatalkan.`
            : 'Tindakan ini akan menghapus skill secara permanen dari sistem identitas karier Anda.'
        }
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}
