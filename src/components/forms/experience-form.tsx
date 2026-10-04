'use client'

import React, { useState, useTransition, useId } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  createExperienceAction,
  updateExperienceAction,
  type ExperienceActionState,
} from '@/app/(dashboard)/dashboard/experience/actions'
import {
  experienceCategories,
  EXPERIENCE_CATEGORY_LABELS,
  type ExperienceCategoryValue,
} from '@/lib/validation/experience'
import { BulletListInput } from '@/components/forms/bullet-list-input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Briefcase,
  Calendar,
  Layers,
  Sparkles,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
  MapPin,
  Trophy,
} from 'lucide-react'

export interface AvailableSkillItem {
  id: string
  name: string
  category: string
  proficiency?: string | null
}

export interface InitialExperienceData {
  id?: string
  organization?: string
  position?: string
  category?: string
  location?: string | null
  startDate?: string | Date | null
  endDate?: string | Date | null
  isCurrent?: boolean
  description?: string | null
  responsibilities?: string[]
  achievements?: string[]
  published?: boolean
  skillIds?: string[]
}

export interface ExperienceFormProps {
  initialData?: InitialExperienceData
  availableSkills?: AvailableSkillItem[]
  mode: 'create' | 'edit'
}

function formatDateForInput(date?: string | Date | null): string {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

export function ExperienceForm({
  initialData,
  availableSkills = [],
  mode,
}: ExperienceFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const formId = useId()

  // Form State
  const [organization, setOrganization] = useState(initialData?.organization || '')
  const [position, setPosition] = useState(initialData?.position || '')
  const [category, setCategory] = useState<ExperienceCategoryValue>(
    (initialData?.category as ExperienceCategoryValue) || 'EMPLOYMENT'
  )
  const [location, setLocation] = useState(initialData?.location || '')

  const [startDate, setStartDate] = useState(formatDateForInput(initialData?.startDate))
  const [endDate, setEndDate] = useState(formatDateForInput(initialData?.endDate))
  const [isCurrent, setIsCurrent] = useState(initialData?.isCurrent || false)

  const [description, setDescription] = useState(initialData?.description || '')
  const [responsibilities, setResponsibilities] = useState<string[]>(
    initialData?.responsibilities || []
  )
  const [achievements, setAchievements] = useState<string[]>(
    initialData?.achievements || []
  )

  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>(
    initialData?.skillIds || []
  )

  const [published, setPublished] = useState(initialData?.published || false)

  // Result & Error State
  const [formState, setFormState] = useState<ExperienceActionState | null>(null)

  const handleToggleSkill = (skillId: string) => {
    if (selectedSkillIds.includes(skillId)) {
      setSelectedSkillIds(selectedSkillIds.filter((id) => id !== skillId))
    } else {
      setSelectedSkillIds([...selectedSkillIds, skillId])
    }
  }

  // Group skills by category
  const skillsByCategory = availableSkills.reduce<Record<string, AvailableSkillItem[]>>(
    (acc, skill) => {
      const cat = skill.category || 'OTHER'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(skill)
      return acc
    },
    {}
  )

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormState(null)

    const formData = new FormData()
    formData.set('organization', organization)
    formData.set('position', position)
    formData.set('category', category)
    formData.set('location', location)
    formData.set('startDate', startDate)
    formData.set('endDate', isCurrent ? '' : endDate)
    formData.set('isCurrent', String(isCurrent))
    formData.set('description', description)
    formData.set('responsibilities', JSON.stringify(responsibilities))
    formData.set('achievements', JSON.stringify(achievements))
    formData.set('skillIds', JSON.stringify(selectedSkillIds))
    formData.set('published', String(published))

    startTransition(async () => {
      let res: ExperienceActionState
      if (mode === 'create') {
        res = await createExperienceAction(null, formData)
      } else {
        res = await updateExperienceAction(initialData!.id!, null, formData)
      }

      setFormState(res)

      if (res.success) {
        router.push('/dashboard/experience')
        router.refresh()
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/experience')}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {mode === 'create' ? 'Tambah Pengalaman Baru' : 'Edit Pengalaman'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Satu form terpadu untuk pekerjaan, magang, organisasi, sukarelawan, dan freelance (PRD 5.3).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/experience')}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button type="submit" disabled={isPending} className="gap-2 min-w-[140px]">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isPending ? 'Menyimpan...' : 'Simpan Pengalaman'}</span>
          </Button>
        </div>
      </div>

      {/* Error & Success Banner */}
      {formState && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${
            formState.success
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}
        >
          {formState.success ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="font-medium">{formState.message}</p>
            {formState.fieldErrors && Object.keys(formState.fieldErrors).length > 0 && (
              <ul className="list-disc list-inside text-xs space-y-0.5">
                {Object.entries(formState.fieldErrors).map(([field, errors]) => (
                  <li key={field}>
                    <span className="font-semibold capitalize">{field}</span>: {errors.join(', ')}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* 1. INFORMASI UTAMA & PERAN */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <CardTitle>Informasi Pokok</CardTitle>
          </div>
          <CardDescription>
            Organisasi, posisi peran, dan kategori pengalaman wajib diisi untuk identifikasi CV dan portofolio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Organisasi / Perusahaan */}
            <div className="space-y-2">
              <Label htmlFor={`${formId}-organization`}>
                Nama Organisasi / Perusahaan <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`${formId}-organization`}
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Contoh: PT Teknologi Bangsa, Google, BEM Universitas"
                disabled={isPending}
                required
              />
              {formState?.fieldErrors?.organization && (
                <p className="text-xs text-destructive">
                  {formState.fieldErrors.organization[0]}
                </p>
              )}
            </div>

            {/* Posisi / Peran */}
            <div className="space-y-2">
              <Label htmlFor={`${formId}-position`}>
                Posisi / Peran <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`${formId}-position`}
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Contoh: Senior Frontend Engineer, Project Officer"
                disabled={isPending}
                required
              />
              {formState?.fieldErrors?.position && (
                <p className="text-xs text-destructive">{formState.fieldErrors.position[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kategori Pengalaman */}
            <div className="space-y-2">
              <Label htmlFor={`${formId}-category`}>
                Kategori Pengalaman <span className="text-destructive">*</span>
              </Label>
              <select
                id={`${formId}-category`}
                value={category}
                onChange={(e) => setCategory(e.target.value as ExperienceCategoryValue)}
                disabled={isPending}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {experienceCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {EXPERIENCE_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>

            {/* Lokasi */}
            <div className="space-y-2">
              <Label htmlFor={`${formId}-location`}>
                Lokasi <span className="text-xs text-muted-foreground font-normal">(Kota, Negara / Remote)</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id={`${formId}-location`}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Contoh: Jakarta, Indonesia atau Remote"
                  className="pl-9"
                  disabled={isPending}
                />
              </div>
            </div>
          </div>

          {/* Deskripsi Gambaran Umum */}
          <div className="space-y-2">
            <Label htmlFor={`${formId}-description`}>
              Gambaran Umum Peran <span className="text-xs text-muted-foreground font-normal">(Opsional)</span>
            </Label>
            <Textarea
              id={`${formId}-description`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ringkasan singkat lingkup tugas, tim, atau misi divisi tempat Anda berkontribusi..."
              rows={3}
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. LINIMASA & TANGGAL AKTIF */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Periode & Linimasa</CardTitle>
          </div>
          <CardDescription>
            Tentukan periode masa tugas atau tandai peran sebagai yang sedang aktif saat ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/60">
            <Switch
              id={`${formId}-isCurrent`}
              checked={isCurrent}
              onCheckedChange={(checked) => {
                setIsCurrent(checked)
                if (checked) setEndDate('')
              }}
              disabled={isPending}
            />
            <Label htmlFor={`${formId}-isCurrent`} className="cursor-pointer font-medium">
              Saat ini Masih Menjabat / Aktif di Sini (Currently Active)
            </Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${formId}-startDate`}>Tanggal Mulai</Label>
              <Input
                id={`${formId}-startDate`}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${formId}-endDate`}>Tanggal Selesai</Label>
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
        </CardContent>
      </Card>

      {/* 3. TANGGUNG JAWAB & PENCAPAIAN (BULLET LIST) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <CardTitle>Tanggung Jawab & Pencapaian</CardTitle>
          </div>
          <CardDescription>
            Poin-poin spesifik yang akan dimasukkan ke format CV ATS dan detail portofolio publik.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Responsibilities */}
          <div className="space-y-2">
            <Label>Tanggung Jawab Utama (Key Responsibilities)</Label>
            <BulletListInput
              value={responsibilities}
              onChange={setResponsibilities}
              placeholder="Contoh: Mengkoordinasikan tim pengembang frontend terdiri dari 5 engineer..."
              disabled={isPending}
            />
          </div>

          {/* Key Achievements */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-amber-500" />
              <Label>Hasil & Pencapaian Utama (Achievements / Outcomes)</Label>
            </div>
            <BulletListInput
              value={achievements}
              onChange={setAchievements}
              placeholder="Contoh: Meraih penghargaan Best Team Award Q3 dan meningkatkan efisiensi sprint 25%..."
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. KETERKAITAN SKILL (ExperienceSkill) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Keterkaitan Skill</CardTitle>
          </div>
          <CardDescription>
            Tandai skill yang Anda terapkan atau kembangkan selama memegang peran ini (ExperienceSkill).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableSkills.length === 0 ? (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-sm">
              <Info className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Belum ada skill yang terdaftar</p>
                <p className="text-xs mt-0.5 text-amber-700 dark:text-amber-400">
                  Anda belum menambahkan keahlian pada profil karier. Kunjungi{' '}
                  <Link
                    href="/dashboard/skills"
                    className="font-semibold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200"
                  >
                    Halaman Kelola Skill
                  </Link>{' '}
                  untuk mendaftarkan keahlian Anda, lalu kaitkan dengan pengalaman ini.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground flex items-center justify-between">
                <span>Pilih skill yang relevan:</span>
                <span className="font-medium">{selectedSkillIds.length} skill terpilih</span>
              </div>

              {Object.entries(skillsByCategory).map(([categoryName, items]) => (
                <div key={categoryName} className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {categoryName}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {items.map((skill) => {
                      const isSelected = selectedSkillIds.includes(skill.id)
                      return (
                        <button
                          key={skill.id}
                          type="button"
                          onClick={() => handleToggleSkill(skill.id)}
                          disabled={isPending}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer select-none ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                              : 'bg-background hover:bg-muted text-foreground border-border'
                          }`}
                        >
                          <span>{skill.name}</span>
                          {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. STATUS PUBLIKASI */}
      <Card>
        <CardHeader>
          <CardTitle>Status Publikasi</CardTitle>
          <CardDescription>
            Pengaturan visibilitas pengalaman pada portofolio publik. Status publikasi terpisah dari pemilihan CV.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/10">
            <div className="space-y-0.5">
              <Label htmlFor={`${formId}-published`} className="text-sm font-semibold cursor-pointer">
                Publikasikan ke Portofolio (Published)
              </Label>
              <p className="text-xs text-muted-foreground">
                Jika dinonaktifkan, pengalaman ini berstatus privat dan hanya tersimpan di dashboard serta dapat dipilih untuk CV privat.
              </p>
            </div>
            <Switch
              id={`${formId}-published`}
              checked={published}
              onCheckedChange={setPublished}
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bottom Submit Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/experience')}
          disabled={isPending}
        >
          Batal
        </Button>
        <Button type="submit" disabled={isPending} className="gap-2 min-w-[140px]">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>{isPending ? 'Menyimpan...' : 'Simpan Pengalaman'}</span>
        </Button>
      </div>
    </form>
  )
}
