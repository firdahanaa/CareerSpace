'use client'

import React, { useState, useTransition, useId } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  createEducationAction,
  updateEducationAction,
  type EducationActionState,
} from '@/app/(dashboard)/dashboard/education/actions'
import { GraduationCap, Loader2, AlertCircle } from 'lucide-react'

export interface EducationDialogData {
  id: string
  institution: string
  degree: string | null
  fieldOfStudy: string | null
  startDate: Date | string | null
  endDate: Date | string | null
  isCurrent: boolean
  gpa: string | null
  description: string | null
  published: boolean
}

export interface EducationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: EducationDialogData | null
  onSuccess?: () => void
}

function formatDateForInput(date?: Date | string | null): string {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

interface EducationFormInnerProps {
  initialData?: EducationDialogData | null
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

function EducationFormInner({
  initialData,
  onOpenChange,
  onSuccess,
}: EducationFormInnerProps) {
  const [isPending, startTransition] = useTransition()
  const formId = useId()
  const isEdit = Boolean(initialData?.id)

  const [institution, setInstitution] = useState(initialData?.institution || '')
  const [degree, setDegree] = useState(initialData?.degree || '')
  const [fieldOfStudy, setFieldOfStudy] = useState(initialData?.fieldOfStudy || '')
  const [startDate, setStartDate] = useState(formatDateForInput(initialData?.startDate))
  const [endDate, setEndDate] = useState(formatDateForInput(initialData?.endDate))
  const [isCurrent, setIsCurrent] = useState(initialData?.isCurrent || false)
  const [gpa, setGpa] = useState(initialData?.gpa || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [published, setPublished] = useState(initialData?.published || false)

  const [formState, setFormState] = useState<EducationActionState | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormState(null)

    const formData = new FormData()
    formData.set('institution', institution)
    formData.set('degree', degree)
    formData.set('fieldOfStudy', fieldOfStudy)
    formData.set('startDate', startDate)
    formData.set('endDate', isCurrent ? '' : endDate)
    formData.set('isCurrent', String(isCurrent))
    formData.set('gpa', gpa)
    formData.set('description', description)
    formData.set('published', String(published))

    startTransition(async () => {
      let res: EducationActionState
      if (isEdit && initialData?.id) {
        res = await updateEducationAction(initialData.id, null, formData)
      } else {
        res = await createEducationAction(null, formData)
      }

      setFormState(res)

      if (res.success) {
        onOpenChange(false)
        onSuccess?.()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <span>{isEdit ? 'Edit Riwayat Pendidikan' : 'Tambah Riwayat Pendidikan'}</span>
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? `Perbarui riwayat pendidikan di "${initialData?.institution}".`
            : 'Tambahkan institusi pendidikan formal, jenjang studi, atau perkiraan kelulusan Anda.'}
        </DialogDescription>
      </DialogHeader>

      {/* Error Banner */}
      {formState && !formState.success && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">{formState.message}</p>
            {formState.fieldErrors && (
              <ul className="list-disc list-inside space-y-0.5">
                {Object.entries(formState.fieldErrors).map(([field, errors]) => (
                  <li key={field}>{errors.join(', ')}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* 1. Institusi (Wajib) */}
      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-institution`}>
          Nama Institusi / Universitas <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`${formId}-institution`}
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
          placeholder="Contoh: Universitas Indonesia, Institut Teknologi Bandung"
          disabled={isPending}
          required
          maxLength={150}
          autoFocus
        />
        {formState?.fieldErrors?.institution && (
          <p className="text-xs text-destructive">{formState.fieldErrors.institution[0]}</p>
        )}
      </div>

      {/* 2. Jenjang Gelar & Bidang Studi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-degree`}>
            Jenjang / Gelar <span className="text-xs text-muted-foreground font-normal">(Opsional)</span>
          </Label>
          <Input
            id={`${formId}-degree`}
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            placeholder="Contoh: Sarjana Komputer (S.Kom), S1, Master"
            disabled={isPending}
            maxLength={100}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-fieldOfStudy`}>
            Jurusan / Bidang Studi <span className="text-xs text-muted-foreground font-normal">(Opsional)</span>
          </Label>
          <Input
            id={`${formId}-fieldOfStudy`}
            value={fieldOfStudy}
            onChange={(e) => setFieldOfStudy(e.target.value)}
            placeholder="Contoh: Ilmu Komputer, Sistem Informasi"
            disabled={isPending}
            maxLength={100}
          />
        </div>
      </div>

      {/* 3. Status Sedang Menempuh Pendidikan */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/10">
        <div className="space-y-0.5">
          <Label htmlFor={`${formId}-isCurrent`} className="text-sm font-semibold cursor-pointer">
            Sedang menempuh pendidikan di sini
          </Label>
          <p className="text-xs text-muted-foreground">
            Jika aktif, tanggal selesai dinonaktifkan (studi masih berjalan).
          </p>
        </div>
        <Switch
          id={`${formId}-isCurrent`}
          checked={isCurrent}
          onCheckedChange={(checked) => {
            setIsCurrent(checked)
            if (checked) {
              setEndDate('')
            }
          }}
          disabled={isPending}
        />
      </div>

      {/* 4. Periode Studi: Mulai & Selesai / Perkiraan Lulus */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-startDate`}>
            Tanggal / Tahun Mulai <span className="text-xs text-muted-foreground font-normal">(Opsional)</span>
          </Label>
          <Input
            id={`${formId}-startDate`}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor={`${formId}-endDate`}
            className={isCurrent ? 'text-muted-foreground' : ''}
          >
            Tanggal Selesai / Perkiraan Lulus{' '}
            <span className="text-xs text-muted-foreground font-normal">(Opsional)</span>
          </Label>
          <Input
            id={`${formId}-endDate`}
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isPending || isCurrent}
            placeholder={isCurrent ? 'Saat ini' : ''}
          />
          {formState?.fieldErrors?.endDate && (
            <p className="text-xs text-destructive">{formState.fieldErrors.endDate[0]}</p>
          )}
        </div>
      </div>

      {/* 5. IPK / Nilai (GPA - Teks Bebas) */}
      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-gpa`}>
          IPK / Nilai Akhir <span className="text-xs text-muted-foreground font-normal">(Opsional, teks bebas)</span>
        </Label>
        <Input
          id={`${formId}-gpa`}
          value={gpa}
          onChange={(e) => setGpa(e.target.value)}
          placeholder="Contoh: 3.82 / 4.00, Cum Laude, First Class Honours"
          disabled={isPending}
          maxLength={50}
        />
      </div>

      {/* 6. Deskripsi / Kegiatan / Tesis */}
      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-description`}>
          Deskripsi & Aktivitas Akademik <span className="text-xs text-muted-foreground font-normal">(Opsional)</span>
        </Label>
        <Textarea
          id={`${formId}-description`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Informasi judul tugas akhir/skripsi, organisasi kemahasiswaan, konsentrasi, atau penghargaan akademik..."
          disabled={isPending}
          rows={3}
          maxLength={1000}
        />
      </div>

      {/* 7. Status Publikasi */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/10">
        <div className="space-y-0.5">
          <Label htmlFor={`${formId}-published`} className="text-sm font-semibold cursor-pointer">
            Publikasikan ke Portofolio
          </Label>
          <p className="text-xs text-muted-foreground">
            Riwayat pendidikan yang dipublikasikan akan tampil pada portfolio publik.
          </p>
        </div>
        <Switch
          id={`${formId}-published`}
          checked={published}
          onCheckedChange={setPublished}
          disabled={isPending}
        />
      </div>

      <DialogFooter className="mt-4 flex flex-row justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
        >
          Batal
        </Button>
        <Button type="submit" disabled={isPending} className="gap-2 min-w-[100px]">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>{isPending ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambah'}</span>
        </Button>
      </DialogFooter>
    </form>
  )
}

export function EducationDialog({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: EducationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {open && (
          <EducationFormInner
            key={initialData?.id || 'new'}
            initialData={initialData}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
