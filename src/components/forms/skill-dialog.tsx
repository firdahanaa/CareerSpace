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
import {
  skillCategories,
  proficiencyLevels,
  SKILL_CATEGORY_LABELS,
  PROFICIENCY_LEVEL_LABELS,
  type SkillCategoryValue,
  type ProficiencyLevelValue,
} from '@/lib/validation/skill'
import {
  createSkillAction,
  updateSkillAction,
  type SkillActionState,
} from '@/app/(dashboard)/dashboard/skills/actions'
import { Sparkles, Info, Loader2, AlertCircle } from 'lucide-react'

export interface SkillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: {
    id: string
    name: string
    category: string
    proficiency: string | null
    published: boolean
  } | null
  defaultCategory?: SkillCategoryValue
  onSuccess?: () => void
}

interface SkillFormInnerProps {
  initialData?: SkillDialogProps['initialData']
  defaultCategory: SkillCategoryValue
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

function SkillFormInner({
  initialData,
  defaultCategory,
  onOpenChange,
  onSuccess,
}: SkillFormInnerProps) {
  const [isPending, startTransition] = useTransition()
  const formId = useId()

  const isEdit = Boolean(initialData?.id)

  // Direct initialization without useEffect cascading renders
  const [name, setName] = useState(initialData?.name || '')
  const [category, setCategory] = useState<SkillCategoryValue>(
    (initialData?.category as SkillCategoryValue) || defaultCategory
  )
  const [proficiency, setProficiency] = useState<ProficiencyLevelValue | ''>(
    (initialData?.proficiency as ProficiencyLevelValue) || ''
  )
  const [published, setPublished] = useState(initialData?.published || false)

  // Form Error State
  const [formState, setFormState] = useState<SkillActionState | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormState(null)

    const formData = new FormData()
    formData.set('name', name)
    formData.set('category', category)
    formData.set('proficiency', proficiency)
    formData.set('published', String(published))

    startTransition(async () => {
      let res: SkillActionState
      if (isEdit && initialData?.id) {
        res = await updateSkillAction(initialData.id, null, formData)
      } else {
        res = await createSkillAction(null, formData)
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
          <Sparkles className="h-5 w-5 text-primary" />
          <span>{isEdit ? 'Edit Skill' : 'Tambah Skill Baru'}</span>
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? `Perbarui informasi keahlian "${initialData?.name}".`
            : 'Tambahkan keahlian teknis, analitis, atau interpersonal ke portofolio Anda.'}
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

      {/* 1. Nama Skill */}
      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-name`}>
          Nama Skill <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`${formId}-name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: PostgreSQL, Next.js, Project Management"
          disabled={isPending}
          required
          maxLength={50}
          autoFocus
        />
        {formState?.fieldErrors?.name && (
          <p className="text-xs text-destructive">{formState.fieldErrors.name[0]}</p>
        )}
      </div>

      {/* 2. Kategori */}
      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-category`}>
          Kategori <span className="text-destructive">*</span>
        </Label>
        <select
          id={`${formId}-category`}
          value={category}
          onChange={(e) => setCategory(e.target.value as SkillCategoryValue)}
          disabled={isPending}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {skillCategories.map((cat) => (
            <option key={cat} value={cat}>
              {SKILL_CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Tingkat Kemahiran (Proficiency) */}
      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-proficiency`}>
          Tingkat Kemahiran <span className="text-xs text-muted-foreground font-normal">(Opsional)</span>
        </Label>
        <select
          id={`${formId}-proficiency`}
          value={proficiency}
          onChange={(e) => setProficiency(e.target.value as ProficiencyLevelValue | '')}
          disabled={isPending}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">-- Tidak ditentukan --</option>
          {proficiencyLevels.map((lvl) => (
            <option key={lvl} value={lvl}>
              {PROFICIENCY_LEVEL_LABELS[lvl]}
            </option>
          ))}
        </select>
      </div>

      {/* Catatan PRD 5.5: Self-assessed disclaimer */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/60 text-muted-foreground text-xs leading-relaxed">
        <Info className="h-4 w-4 shrink-0 text-muted-foreground/80 mt-0.5" />
        <p>
          <strong>Catatan Penilaian:</strong> Tingkat kemahiran bersifat penilaian mandiri (<em>self-assessed</em>) dan tidak ditampilkan sebagai klaim yang terverifikasi secara objektif di portofolio atau CV (PRD 5.5).
        </p>
      </div>

      {/* 4. Status Publikasi */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/10">
        <div className="space-y-0.5">
          <Label htmlFor={`${formId}-published`} className="text-sm font-semibold cursor-pointer">
            Publikasikan ke Portofolio
          </Label>
          <p className="text-xs text-muted-foreground">
            Skill yang dipublikasikan akan tampil pada halaman portofolio publik.
          </p>
        </div>
        <Switch
          id={`${formId}-published`}
          checked={published}
          onCheckedChange={setPublished}
          disabled={isPending}
        />
      </div>

      <DialogFooter className="mt-4 flex flex-row justify-end gap-2">
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

export function SkillDialog({
  open,
  onOpenChange,
  initialData,
  defaultCategory = 'TECHNICAL',
  onSuccess,
}: SkillDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <SkillFormInner
            key={`${initialData?.id || 'new'}-${defaultCategory}`}
            initialData={initialData}
            defaultCategory={defaultCategory}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
