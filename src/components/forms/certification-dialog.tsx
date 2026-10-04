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
  createCertificationAction,
  updateCertificationAction,
  type CertificationActionState,
} from '@/app/(dashboard)/dashboard/certifications/actions'
import { Award, Loader2, AlertCircle } from 'lucide-react'

export interface CertificationDialogData {
  id: string
  title: string
  issuer: string | null
  issueDate: Date | string | null
  expirationDate: Date | string | null
  credentialId: string | null
  credentialUrl: string | null
  description: string | null
  published: boolean
}

export interface CertificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: CertificationDialogData | null
  onSuccess?: () => void
}

function formatDateForInput(date?: Date | string | null): string {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

interface CertificationFormInnerProps {
  initialData?: CertificationDialogData | null
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

function CertificationFormInner({
  initialData,
  onOpenChange,
  onSuccess,
}: CertificationFormInnerProps) {
  const [isPending, startTransition] = useTransition()
  const formId = useId()
  const isEdit = Boolean(initialData?.id)

  const [title, setTitle] = useState(initialData?.title || '')
  const [issuer, setIssuer] = useState(initialData?.issuer || '')
  const [issueDate, setIssueDate] = useState(formatDateForInput(initialData?.issueDate))
  const [expirationDate, setExpirationDate] = useState(
    formatDateForInput(initialData?.expirationDate)
  )
  const [credentialId, setCredentialId] = useState(initialData?.credentialId || '')
  const [credentialUrl, setCredentialUrl] = useState(initialData?.credentialUrl || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [published, setPublished] = useState(initialData?.published || false)

  const [formState, setFormState] = useState<CertificationActionState | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormState(null)

    const formData = new FormData()
    formData.set('title', title)
    formData.set('issuer', issuer)
    formData.set('issueDate', issueDate)
    formData.set('expirationDate', expirationDate)
    formData.set('credentialId', credentialId)
    formData.set('credentialUrl', credentialUrl)
    formData.set('description', description)
    formData.set('published', String(published))

    startTransition(async () => {
      let res: CertificationActionState
      if (isEdit && initialData?.id) {
        res = await updateCertificationAction(initialData.id, null, formData)
      } else {
        res = await createCertificationAction(null, formData)
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
          <Award className="h-5 w-5 text-primary" />
          <span>
            {isEdit
              ? 'Edit Sertifikasi / Pencapaian'
              : 'Tambah Sertifikasi & Pencapaian'}
          </span>
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? `Perbarui informasi untuk "${initialData?.title}".`
            : 'Tambahkan sertifikasi profesional, lisensi, penghargaan, atau prestasi yang relevan.'}
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

      {/* 1. Judul Sertifikasi / Pencapaian (Wajib) */}
      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-title`}>
          Judul Sertifikasi / Pencapaian <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`${formId}-title`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Contoh: AWS Certified Solutions Architect, Juara 1 Hackathon Nasional"
          disabled={isPending}
          required
          maxLength={150}
          autoFocus
        />
        {formState?.fieldErrors?.title && (
          <p className="text-xs text-destructive">{formState.fieldErrors.title[0]}</p>
        )}
      </div>

      {/* 2. Lembaga Penerbit / Penyelenggara */}
      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-issuer`}>
          Penerbit / Penyelenggara <span className="text-xs text-muted-foreground font-normal">(Opsional)</span>
        </Label>
        <Input
          id={`${formId}-issuer`}
          value={issuer}
          onChange={(e) => setIssuer(e.target.value)}
          placeholder="Contoh: Amazon Web Services, Google, Coursera, Kemendikbud"
          disabled={isPending}
          maxLength={100}
        />
      </div>

      {/* 3. Tanggal Terbit & Kedaluwarsa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-issueDate`}>
            Tanggal Terbit <span className="text-xs text-muted-foreground font-normal">(Opsional)</span>
          </Label>
          <Input
            id={`${formId}-issueDate`}
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-expirationDate`}>
            Tanggal Kedaluwarsa <span className="text-xs text-muted-foreground font-normal">(Opsional)</span>
          </Label>
          <Input
            id={`${formId}-expirationDate`}
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            disabled={isPending}
          />
          {formState?.fieldErrors?.expirationDate && (
            <p className="text-xs text-destructive">{formState.fieldErrors.expirationDate[0]}</p>
          )}
        </div>
      </div>

      {/* 4. ID Kredensial & URL Sertifikat */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-credentialId`}>
            ID Kredensial <span className="text-xs text-muted-foreground font-normal">(Opsional)</span>
          </Label>
          <Input
            id={`${formId}-credentialId`}
            value={credentialId}
            onChange={(e) => setCredentialId(e.target.value)}
            placeholder="Contoh: AWS-ASA-123456"
            disabled={isPending}
            maxLength={100}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-credentialUrl`}>
            URL Verifikasi Kredensial <span className="text-xs text-muted-foreground font-normal">(Opsional)</span>
          </Label>
          <Input
            id={`${formId}-credentialUrl`}
            type="url"
            value={credentialUrl}
            onChange={(e) => setCredentialUrl(e.target.value)}
            placeholder="https://..."
            disabled={isPending}
          />
          {formState?.fieldErrors?.credentialUrl && (
            <p className="text-xs text-destructive">{formState.fieldErrors.credentialUrl[0]}</p>
          )}
        </div>
      </div>

      {/* 5. Deskripsi */}
      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-description`}>
          Deskripsi & Keterangan <span className="text-xs text-muted-foreground font-normal">(Opsional)</span>
        </Label>
        <Textarea
          id={`${formId}-description`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ringkasan kompetensi yang diuji, materi sertifikasi, atau latar belakang prestasi..."
          disabled={isPending}
          rows={3}
          maxLength={1000}
        />
      </div>

      {/* 6. Status Publikasi */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/10">
        <div className="space-y-0.5">
          <Label htmlFor={`${formId}-published`} className="text-sm font-semibold cursor-pointer">
            Publikasikan ke Portofolio
          </Label>
          <p className="text-xs text-muted-foreground">
            Sertifikasi/pencapaian yang dipublikasikan akan tampil di portfolio publik.
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

export function CertificationDialog({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: CertificationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {open && (
          <CertificationFormInner
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
