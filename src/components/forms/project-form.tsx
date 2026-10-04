'use client'

import React, { useState, useTransition, useId } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  createProjectAction,
  updateProjectAction,
  type ProjectActionState,
} from '@/app/(dashboard)/dashboard/projects/actions'
import {
  projectTypes,
  PROJECT_TYPE_LABELS,
  type ProjectTypeValue,
} from '@/lib/validation/project'
import { slugify } from '@/lib/slug'
import { TagInput } from '@/components/forms/tag-input'
import { BulletListInput } from '@/components/forms/bullet-list-input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Sparkles,
  Link as LinkIcon,
  Calendar,
  Layers,
  FileText,
  Info,
} from 'lucide-react'

export interface AvailableSkillItem {
  id: string
  name: string
  category: string
  proficiency?: string | null
}

export interface InitialProjectData {
  id?: string
  title?: string
  shortSummary?: string
  slug?: string
  description?: string | null
  role?: string | null
  projectType?: string | null
  startDate?: string | Date | null
  endDate?: string | Date | null
  isOngoing?: boolean
  technologies?: string[]
  responsibilities?: string[]
  outcomes?: string[]
  repositoryUrl?: string | null
  demoUrl?: string | null
  coverImageUrl?: string | null
  featured?: boolean
  published?: boolean
  skillIds?: string[]
}

export interface ProjectFormProps {
  initialData?: InitialProjectData
  availableSkills?: AvailableSkillItem[]
  mode: 'create' | 'edit'
}

function formatDateForInput(date?: string | Date | null): string {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

export function ProjectForm({ initialData, availableSkills = [], mode }: ProjectFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const formId = useId()

  // Form State
  const [title, setTitle] = useState(initialData?.title || '')
  const [shortSummary, setShortSummary] = useState(initialData?.shortSummary || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(mode === 'edit')

  const [description, setDescription] = useState(initialData?.description || '')
  const [role, setRole] = useState(initialData?.role || '')
  const [projectType, setProjectType] = useState<ProjectTypeValue | ''>(
    (initialData?.projectType as ProjectTypeValue) || ''
  )

  const [startDate, setStartDate] = useState(formatDateForInput(initialData?.startDate))
  const [endDate, setEndDate] = useState(formatDateForInput(initialData?.endDate))
  const [isOngoing, setIsOngoing] = useState(initialData?.isOngoing || false)

  const [technologies, setTechnologies] = useState<string[]>(initialData?.technologies || [])
  const [responsibilities, setResponsibilities] = useState<string[]>(
    initialData?.responsibilities || []
  )
  const [outcomes, setOutcomes] = useState<string[]>(initialData?.outcomes || [])

  const [repositoryUrl, setRepositoryUrl] = useState(initialData?.repositoryUrl || '')
  const [demoUrl, setDemoUrl] = useState(initialData?.demoUrl || '')

  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>(
    initialData?.skillIds || []
  )

  // Status flags
  const [published, setPublished] = useState(initialData?.published || false)
  const [featured, setFeatured] = useState(initialData?.featured || false)

  // Cover image preview and upload state
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(
    initialData?.coverImageUrl || null
  )
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null)
  const [removeCover, setRemoveCover] = useState(false)

  // Result & Error State
  const [formState, setFormState] = useState<ProjectActionState | null>(null)

  // Auto-slug update saat title berubah (jika belum diedit manual)
  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (!isSlugManuallyEdited && mode === 'create') {
      setSlug(slugify(val))
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCoverFile(file)
    setRemoveCover(false)

    // Revoke previous preview
    if (coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl)
    }
    setCoverPreviewUrl(URL.createObjectURL(file))
  }

  const handleRemoveCover = () => {
    setCoverFile(null)
    if (coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl)
      setCoverPreviewUrl(null)
    }
    setExistingCoverUrl(null)
    setRemoveCover(true)
  }

  const handleToggleSkill = (skillId: string) => {
    if (selectedSkillIds.includes(skillId)) {
      setSelectedSkillIds(selectedSkillIds.filter((id) => id !== skillId))
    } else {
      setSelectedSkillIds([...selectedSkillIds, skillId])
    }
  }

  // Handle Published Toggle: Jika unpublish, unfeature otomatis
  const handlePublishedChange = (checked: boolean) => {
    setPublished(checked)
    if (!checked) {
      setFeatured(false)
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormState(null)

    const formData = new FormData()
    formData.set('title', title)
    formData.set('shortSummary', shortSummary)
    formData.set('slug', slug)
    formData.set('description', description)
    formData.set('role', role)
    formData.set('projectType', projectType)
    formData.set('startDate', startDate)
    formData.set('endDate', isOngoing ? '' : endDate)
    formData.set('isOngoing', String(isOngoing))
    formData.set('technologies', JSON.stringify(technologies))
    formData.set('responsibilities', JSON.stringify(responsibilities))
    formData.set('outcomes', JSON.stringify(outcomes))
    formData.set('repositoryUrl', repositoryUrl)
    formData.set('demoUrl', demoUrl)
    formData.set('skillIds', JSON.stringify(selectedSkillIds))
    formData.set('published', String(published))
    formData.set('featured', String(featured))
    formData.set('removeCover', String(removeCover))

    if (coverFile) {
      formData.set('coverImage', coverFile)
    }

    startTransition(async () => {
      let result: ProjectActionState
      if (mode === 'create') {
        result = await createProjectAction(null, formData)
      } else {
        result = await updateProjectAction(initialData!.id!, null, formData)
      }

      setFormState(result)

      if (result.success) {
        // Redirect kembali ke daftar project
        router.push('/dashboard/projects')
        router.refresh()
      } else {
        // Scroll ke atas agar error terlihat
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })
  }

  const activeCoverUrl = coverPreviewUrl || (!removeCover ? existingCoverUrl : null)

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/projects')}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {mode === 'create' ? 'Tambah Proyek Baru' : 'Edit Proyek'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === 'create'
                ? 'Tambahkan rekam jejak karya atau aplikasi ke dalam sistem identitas profesional Anda.'
                : `Memperbarui rincian proyek "${title}".`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/projects')}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button type="submit" disabled={isPending} className="gap-2 min-w-[120px]">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isPending ? 'Menyimpan...' : 'Simpan Proyek'}</span>
          </Button>
        </div>
      </div>

      {/* Banner Notifikasi Pesan Server */}
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

      {/* 1. INFORMASI UTAMA (WAJIB) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Informasi Utama</CardTitle>
          </div>
          <CardDescription>
            Judul dan ringkasan singkat adalah field wajib untuk mengidentifikasi proyek di portofolio dan CV.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Judul Proyek */}
            <div className="space-y-2">
              <Label htmlFor={`${formId}-title`}>
                Judul Proyek <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`${formId}-title`}
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Contoh: MyCareerSpace Portfolio & CV Generator"
                disabled={isPending}
                required
              />
              {formState?.fieldErrors?.title && (
                <p className="text-xs text-destructive">{formState.fieldErrors.title[0]}</p>
              )}
            </div>

            {/* Slug URL */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={`${formId}-slug`}>
                  Slug URL <span className="text-xs text-muted-foreground font-normal">(Otomatis/Kustom)</span>
                </Label>
                {mode === 'edit' && (
                  <span className="text-[11px] text-muted-foreground">
                    Stabil untuk tautan eksternal
                  </span>
                )}
              </div>
              <Input
                id={`${formId}-slug`}
                value={slug}
                onChange={(e) => {
                  setSlug(slugify(e.target.value))
                  setIsSlugManuallyEdited(true)
                }}
                placeholder="contoh-mycareerspace"
                disabled={isPending}
              />
              {formState?.fieldErrors?.slug && (
                <p className="text-xs text-destructive">{formState.fieldErrors.slug[0]}</p>
              )}
            </div>
          </div>

          {/* Ringkasan Singkat (Short Summary) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${formId}-shortSummary`}>
                Ringkasan Singkat <span className="text-destructive">*</span>
              </Label>
              <span className="text-xs text-muted-foreground">
                {shortSummary.length}/300 karakter
              </span>
            </div>
            <Textarea
              id={`${formId}-shortSummary`}
              value={shortSummary}
              onChange={(e) => setShortSummary(e.target.value)}
              placeholder="Deskripsi 1-2 kalimat untuk kartu portofolio dan ringkasan CV..."
              rows={2}
              maxLength={300}
              disabled={isPending}
              required
            />
            {formState?.fieldErrors?.shortSummary && (
              <p className="text-xs text-destructive">{formState.fieldErrors.shortSummary[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipe Proyek */}
            <div className="space-y-2">
              <Label htmlFor={`${formId}-projectType`}>Tipe Proyek</Label>
              <select
                id={`${formId}-projectType`}
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as ProjectTypeValue)}
                disabled={isPending}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">-- Pilih Tipe Proyek --</option>
                {projectTypes.map((type) => (
                  <option key={type} value={type}>
                    {PROJECT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            {/* Peran / Kontribusi */}
            <div className="space-y-2">
              <Label htmlFor={`${formId}-role`}>Peran / Kontribusi</Label>
              <Input
                id={`${formId}-role`}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Contoh: Lead Developer, Frontend Architect, Solo Creator"
                disabled={isPending}
              />
            </div>
          </div>

          {/* Deskripsi Rinci */}
          <div className="space-y-2">
            <Label htmlFor={`${formId}-description`}>
              Deskripsi Lengkap <span className="text-xs text-muted-foreground font-normal">(Untuk halaman detail portofolio)</span>
            </Label>
            <Textarea
              id={`${formId}-description`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan latar belakang, arsitektur, tantangan teknik, dan solusi yang diimplementasikan..."
              rows={5}
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. LINIMASA & TANGGAL */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Linimasa Pengerjaan</CardTitle>
          </div>
          <CardDescription>
            Tentukan periode proyek berjalan atau aktifkan status sedang berlangsung.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/60">
            <Switch
              id={`${formId}-ongoing`}
              checked={isOngoing}
              onCheckedChange={(checked) => {
                setIsOngoing(checked)
                if (checked) setEndDate('')
              }}
              disabled={isPending}
            />
            <Label htmlFor={`${formId}-ongoing`} className="cursor-pointer font-medium">
              Proyek Sedang Berlangsung (Ongoing)
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
                disabled={isPending || isOngoing}
                placeholder={isOngoing ? 'Sedang berlangsung' : ''}
              />
              {formState?.fieldErrors?.endDate && (
                <p className="text-xs text-destructive">{formState.fieldErrors.endDate[0]}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. TEKNOLOGI, RESPONSIBILITIES & OUTCOMES */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <CardTitle>Teknis & Kontribusi</CardTitle>
          </div>
          <CardDescription>
            Teknologi digunakan sebagai tag pencocokan saran CV. Tanggung jawab dan capaian memperkaya isi resume.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tag Technologies */}
          <div className="space-y-2">
            <Label>Teknologi & Perangkat (Technologies / Tools)</Label>
            <TagInput
              value={technologies}
              onChange={setTechnologies}
              placeholder="Ketik nama teknologi (mis. React, TypeScript, PostgreSQL) lalu tekan Enter..."
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Gunakan tag bebas untuk mendeskripsikan stack teknologi utama proyek ini.
            </p>
          </div>

          {/* Key Responsibilities */}
          <div className="space-y-2">
            <Label>Tanggung Jawab Utama (Key Responsibilities)</Label>
            <BulletListInput
              value={responsibilities}
              onChange={setResponsibilities}
              placeholder="Contoh: Merancang skema basis data PostgreSQL dan relasi ORM Prisma..."
              disabled={isPending}
            />
          </div>

          {/* Outcomes / Achievements */}
          <div className="space-y-2">
            <Label>Hasil & Pencapaian (Outcomes / Impact)</Label>
            <BulletListInput
              value={outcomes}
              onChange={setOutcomes}
              placeholder="Contoh: Mengurangi latency query sebesar 40% dan mencapai 99.9% uptime..."
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. GAMBAR COVER & TAUTAN EKSTERNAL */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-primary" />
            <CardTitle>Cover & Tautan Eksternal</CardTitle>
          </div>
          <CardDescription>
            Gambar showcase portofolio serta tautan repositori kode dan demo langsung.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cover Image Upload */}
          <div className="space-y-3">
            <Label htmlFor={`${formId}-cover`}>Gambar Sampul (Cover Image)</Label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {activeCoverUrl ? (
                <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-border shadow-xs shrink-0 group">
                  <Image
                    src={activeCoverUrl}
                    alt="Preview Cover"
                    fill
                    className="object-cover"
                    unoptimized={activeCoverUrl.startsWith('blob:')}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={handleRemoveCover}
                      className="h-8 w-8"
                      title="Hapus gambar cover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-40 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground text-xs p-2 text-center bg-muted/10 shrink-0">
                  <Upload className="h-5 w-5 mb-1 text-muted-foreground/60" />
                  <span>Belum ada cover</span>
                </div>
              )}

              <div className="space-y-1.5 flex-1">
                <Input
                  id={`${formId}-cover`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverChange}
                  disabled={isPending}
                  className="max-w-md"
                />
                <p className="text-xs text-muted-foreground">
                  Format didukung: JPEG, PNG, WebP. Maksimal 2MB. Rasio lanskap disarankan.
                </p>
                {formState?.fieldErrors?.coverImage && (
                  <p className="text-xs text-destructive">{formState.fieldErrors.coverImage[0]}</p>
                )}
              </div>
            </div>
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${formId}-repo`}>URL Repositori (GitHub / GitLab)</Label>
              <Input
                id={`${formId}-repo`}
                type="url"
                value={repositoryUrl}
                onChange={(e) => setRepositoryUrl(e.target.value)}
                placeholder="https://github.com/username/project"
                disabled={isPending}
              />
              {formState?.fieldErrors?.repositoryUrl && (
                <p className="text-xs text-destructive">{formState.fieldErrors.repositoryUrl[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${formId}-demo`}>URL Demo / Live Website</Label>
              <Input
                id={`${formId}-demo`}
                type="url"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="https://myproject.com"
                disabled={isPending}
              />
              {formState?.fieldErrors?.demoUrl && (
                <p className="text-xs text-destructive">{formState.fieldErrors.demoUrl[0]}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. HUBUNGKAN SKILL (ProjectSkill) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Keterkaitan Skill</CardTitle>
          </div>
          <CardDescription>
            Hubungkan proyek ini dengan daftar skill terdaftar pada profil karier Anda (relasi ProjectSkill).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableSkills.length === 0 ? (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-sm">
              <Info className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Belum ada skill yang terdaftar</p>
                <p className="text-xs mt-0.5 text-amber-700 dark:text-amber-400">
                  Anda belum menambahkan skill pada profil karier. Kunjungi{' '}
                  <Link
                    href="/dashboard/skills"
                    className="font-semibold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200"
                  >
                    Halaman Kelola Skill
                  </Link>{' '}
                  untuk mendaftarkan keahlian Anda, lalu hubungkan kembali ke proyek ini.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground flex items-center justify-between">
                <span>Pilih skill yang diterapkan dalam proyek ini:</span>
                <span className="font-medium">{selectedSkillIds.length} skill terpilih</span>
              </div>

              {Object.entries(skillsByCategory).map(([category, items]) => (
                <div key={category} className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {category}
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

      {/* 6. PENGATURAN STATUS PUBLIKASI & FEATURED */}
      <Card>
        <CardHeader>
          <CardTitle>Status Publikasi</CardTitle>
          <CardDescription>
            Atur keterlihatan proyek di portofolio publik. Status publikasi terpisah dari pilihan CV.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/10">
            <div className="space-y-0.5">
              <Label htmlFor={`${formId}-published`} className="text-sm font-semibold cursor-pointer">
                Publikasikan ke Portofolio (Published)
              </Label>
              <p className="text-xs text-muted-foreground">
                Jika dinonaktifkan, proyek berstatus privat dan hanya tersimpan di dashboard serta dapat dipilih untuk CV privat.
              </p>
            </div>
            <Switch
              id={`${formId}-published`}
              checked={published}
              onCheckedChange={handlePublishedChange}
              disabled={isPending}
            />
          </div>

          <div
            className={`flex items-center justify-between p-3 rounded-lg border transition-opacity ${
              published
                ? 'border-border/60 bg-muted/10 opacity-100'
                : 'border-border/30 bg-muted/5 opacity-50'
            }`}
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor={`${formId}-featured`} className="text-sm font-semibold cursor-pointer">
                  Tampilkan sebagai Proyek Unggulan (Featured)
                </Label>
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <p className="text-xs text-muted-foreground">
                Proyek unggulan akan disorot pada halaman beranda portofolio publik. Hanya dapat diaktifkan jika berstatus Published.
              </p>
            </div>
            <Switch
              id={`${formId}-featured`}
              checked={featured}
              onCheckedChange={setFeatured}
              disabled={isPending || !published}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bottom Submit Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/projects')}
          disabled={isPending}
        >
          Batal
        </Button>
        <Button type="submit" disabled={isPending} className="gap-2 min-w-[130px]">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>{isPending ? 'Menyimpan...' : 'Simpan Proyek'}</span>
        </Button>
      </div>
    </form>
  )
}
