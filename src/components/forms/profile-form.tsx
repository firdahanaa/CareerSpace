'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { updateProfileAction, type ProfileActionState } from '@/app/(dashboard)/dashboard/profile/actions'
import { ProfileCard } from '@/components/public/profile-card'
import type { OtherLinkItem } from '@/lib/validation/profile'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Plus,
  Trash2,
  Upload,
  Eye,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
} from 'lucide-react'

interface InitialProfileData {
  fullName: string
  headline: string
  summary: string | null
  photoUrl: string | null
  email: string | null
  phone: string | null
  location: string | null
  linkedinUrl: string | null
  githubUrl: string | null
  otherLinks: unknown
}

interface InitialSettingsData {
  showEmail: boolean
  showPhone: boolean
  showLocation: boolean
  showLinkedin: boolean
  showGithub: boolean
}

interface ProfileFormProps {
  initialProfile: InitialProfileData | null
  initialSettings: InitialSettingsData | null
}

function parseOtherLinks(raw: unknown): OtherLinkItem[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (item): item is OtherLinkItem =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.label === 'string' &&
      typeof item.url === 'string'
  )
}

export function ProfileForm({ initialProfile, initialSettings }: ProfileFormProps) {
  // Form fields state (Preserves state on error)
  const [fullName, setFullName] = useState(initialProfile?.fullName || '')
  const [headline, setHeadline] = useState(initialProfile?.headline || '')
  const [summary, setSummary] = useState(initialProfile?.summary || '')
  const [email, setEmail] = useState(initialProfile?.email || '')
  const [phone, setPhone] = useState(initialProfile?.phone || '')
  const [location, setLocation] = useState(initialProfile?.location || '')
  const [linkedinUrl, setLinkedinUrl] = useState(initialProfile?.linkedinUrl || '')
  const [githubUrl, setGithubUrl] = useState(initialProfile?.githubUrl || '')

  // Other links state
  const [otherLinks, setOtherLinks] = useState<OtherLinkItem[]>(
    parseOtherLinks(initialProfile?.otherLinks)
  )

  // Visibility switches state
  const [showEmail, setShowEmail] = useState(initialSettings?.showEmail ?? false)
  const [showPhone, setShowPhone] = useState(initialSettings?.showPhone ?? false)
  const [showLocation, setShowLocation] = useState(initialSettings?.showLocation ?? true)
  const [showLinkedin, setShowLinkedin] = useState(initialSettings?.showLinkedin ?? true)
  const [showGithub, setShowGithub] = useState(initialSettings?.showGithub ?? true)

  // Photo state
  const [photoUrl, setPhotoUrl] = useState(initialProfile?.photoUrl || null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(initialProfile?.photoUrl || null)
  const [removePhoto, setRemovePhoto] = useState(false)

  // Feedback state
  const [isPending, startTransition] = useTransition()
  const [actionState, setActionState] = useState<ProfileActionState | null>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)

  // Handle Photo selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      setRemovePhoto(false)
      const objectUrl = URL.createObjectURL(file)
      setPreviewPhotoUrl(objectUrl)
    }
  }

  // Handle Photo removal
  const handleRemovePhoto = () => {
    setPhotoFile(null)
    setPreviewPhotoUrl(null)
    setRemovePhoto(true)
  }

  // Dynamic Other Links handlers
  const handleAddLink = () => {
    setOtherLinks([...otherLinks, { label: '', url: '' }])
  }

  const handleUpdateLink = (index: number, field: 'label' | 'url', value: string) => {
    const updated = [...otherLinks]
    updated[index][field] = value
    setOtherLinks(updated)
  }

  const handleRemoveLink = (index: number) => {
    setOtherLinks(otherLinks.filter((_, i) => i !== index))
  }

  // Submit Handler
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setActionState(null)

    const formData = new FormData()
    formData.append('fullName', fullName)
    formData.append('headline', headline)
    formData.append('summary', summary)
    formData.append('email', email)
    formData.append('phone', phone)
    formData.append('location', location)
    formData.append('linkedinUrl', linkedinUrl)
    formData.append('githubUrl', githubUrl)
    formData.append('otherLinks', JSON.stringify(otherLinks))

    formData.append('showEmail', showEmail ? 'true' : 'false')
    formData.append('showPhone', showPhone ? 'true' : 'false')
    formData.append('showLocation', showLocation ? 'true' : 'false')
    formData.append('showLinkedin', showLinkedin ? 'true' : 'false')
    formData.append('showGithub', showGithub ? 'true' : 'false')

    formData.append('existingPhotoUrl', photoUrl || '')
    formData.append('removePhoto', removePhoto ? 'true' : 'false')
    if (photoFile) {
      formData.append('photoFile', photoFile)
    }

    startTransition(async () => {
      const res = await updateProfileAction(null, formData)
      setActionState(res)
      if (res.success && res.photoUrl !== undefined) {
        setPhotoUrl(res.photoUrl)
        setPreviewPhotoUrl(res.photoUrl)
        setPhotoFile(null)
        setRemovePhoto(false)
      }
    })
  }

  // Real-time object for public preview
  const currentPreviewProfile = {
    fullName,
    headline,
    summary,
    photoUrl: previewPhotoUrl,
    email,
    phone,
    location,
    linkedinUrl,
    githubUrl,
    otherLinks,
  }

  const currentVisibility = {
    showEmail,
    showPhone,
    showLocation,
    showLinkedin,
    showGithub,
  }

  return (
    <div className="space-y-6">
      {/* Header & Preview Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Kelola Profil</h1>
          <p className="text-sm text-muted-foreground">
            Perbarui data diri profesional Anda. Nilai yang disimpan dipakai bersama untuk portofolio publik dan CV.
          </p>
        </div>

        {/* Modal Pratinjau Tampilan Publik (PROF-04) */}
        <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
          <DialogTrigger
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'gap-2 shrink-0 cursor-pointer h-9 px-3'
            )}
          >
            <Eye className="h-4 w-4 text-primary" />
            <span>Pratinjau Tampilan Publik</span>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                <span>Pratinjau Profil Publik</span>
              </DialogTitle>
              <DialogDescription>
                Tampilan ini menampilkan profil Anda persis sebagaimana pengunjung melihatnya, hanya menampilkan field yang diizinkan visibilitasnya.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              <ProfileCard profile={currentPreviewProfile} visibility={currentVisibility} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alert Status Feedback */}
      {actionState && (
        <div
          role="alert"
          className={`flex items-start gap-3 p-4 rounded-lg border text-sm ${
            actionState.success
              ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-destructive/15 text-destructive border-destructive/20 font-medium'
          }`}
        >
          {actionState.success ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
          )}
          <div className="space-y-1">
            <p>{actionState.message}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Informasi Utama & Foto Profil */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Dasar & Foto</CardTitle>
            <CardDescription>
              Nama lengkap dan headline wajib diisi. Field ini merupakan identitas utama Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Foto Profil Upload */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-2">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-border shadow-xs bg-muted">
                {previewPhotoUrl ? (
                  <Image
                    src={previewPhotoUrl}
                    alt="Foto Profil"
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-8 w-8 opacity-40" />
                  </div>
                )}
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <Label htmlFor="photoFile" className="text-sm font-semibold">
                  Foto Profil
                </Label>
                <p className="text-xs text-muted-foreground">
                  Gunakan format JPEG, PNG, atau WebP (maksimal 2MB). Foto lama otomatis diganti saat mengunggah foto baru.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Label
                    htmlFor="photoFile"
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5 text-xs font-medium transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Pilih Foto Baru</span>
                  </Label>
                  <input
                    id="photoFile"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={handlePhotoChange}
                    disabled={isPending}
                  />

                  {previewPhotoUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemovePhoto}
                      disabled={isPending}
                      className="text-xs text-destructive hover:bg-destructive/10"
                    >
                      Hapus Foto
                    </Button>
                  )}
                </div>
                {actionState?.fieldErrors?.photoFile && (
                  <p className="text-xs text-destructive mt-1">
                    {actionState.fieldErrors.photoFile[0]}
                  </p>
                )}
              </div>
            </div>

            {/* Full Name (Wajib) */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Nama Lengkap <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                name="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Firda Hana"
                required
                disabled={isPending}
              />
              {actionState?.fieldErrors?.fullName && (
                <p className="text-xs text-destructive">{actionState.fieldErrors.fullName[0]}</p>
              )}
            </div>

            {/* Headline (Wajib) */}
            <div className="space-y-1.5">
              <Label htmlFor="headline" className="text-sm font-medium">
                Headline Profesional <span className="text-destructive">*</span>
              </Label>
              <Input
                id="headline"
                name="headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Contoh: Full Stack Engineer & Technical Architect"
                required
                disabled={isPending}
              />
              {actionState?.fieldErrors?.headline && (
                <p className="text-xs text-destructive">{actionState.fieldErrors.headline[0]}</p>
              )}
            </div>

            {/* Summary (Opsional) */}
            <div className="space-y-1.5">
              <Label htmlFor="summary" className="text-sm font-medium">
                Ringkasan Profil (Bio Singkat)
              </Label>
              <Textarea
                id="summary"
                name="summary"
                rows={4}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Tulis ringkasan singkat perjalanan karier, keahlian utama, dan fokus profesional Anda..."
                disabled={isPending}
              />
              {actionState?.fieldErrors?.summary && (
                <p className="text-xs text-destructive">{actionState.fieldErrors.summary[0]}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Informasi Kontak & Media Sosial */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kontak & Tautan Sosial</CardTitle>
            <CardDescription>
              Isi data kontak dan tautan profil sosial. Kolom ini bersifat opsional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Kontak
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@firdahana.dev"
                  disabled={isPending}
                />
                {actionState?.fieldErrors?.email && (
                  <p className="text-xs text-destructive">{actionState.fieldErrors.email[0]}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Nomor Telepon / WhatsApp
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+62 812-3456-7890"
                  disabled={isPending}
                />
                {actionState?.fieldErrors?.phone && (
                  <p className="text-xs text-destructive">{actionState.fieldErrors.phone[0]}</p>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-sm font-medium">
                Lokasi Domisili
              </Label>
              <Input
                id="location"
                name="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Jakarta, Indonesia"
                disabled={isPending}
              />
              {actionState?.fieldErrors?.location && (
                <p className="text-xs text-destructive">{actionState.fieldErrors.location[0]}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* LinkedIn URL */}
              <div className="space-y-1.5">
                <Label htmlFor="linkedinUrl" className="text-sm font-medium">
                  URL LinkedIn
                </Label>
                <Input
                  id="linkedinUrl"
                  name="linkedinUrl"
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  disabled={isPending}
                />
                {actionState?.fieldErrors?.linkedinUrl && (
                  <p className="text-xs text-destructive">
                    {actionState.fieldErrors.linkedinUrl[0]}
                  </p>
                )}
              </div>

              {/* GitHub URL */}
              <div className="space-y-1.5">
                <Label htmlFor="githubUrl" className="text-sm font-medium">
                  URL GitHub
                </Label>
                <Input
                  id="githubUrl"
                  name="githubUrl"
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  disabled={isPending}
                />
                {actionState?.fieldErrors?.githubUrl && (
                  <p className="text-xs text-destructive">
                    {actionState.fieldErrors.githubUrl[0]}
                  </p>
                )}
              </div>
            </div>

            {/* Other Links (Dynamic) */}
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Tautan Tambahan (Blog, Portofolio, dll)</Label>
                  <p className="text-xs text-muted-foreground">
                    Tambahkan tautan khusus dengan label yang Anda tentukan sendiri.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLink}
                  disabled={isPending}
                  className="gap-1.5 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Tautan</span>
                </Button>
              </div>

              {otherLinks.length > 0 ? (
                <div className="space-y-2.5">
                  {otherLinks.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        placeholder="Label (mis. Blog)"
                        value={link.label}
                        onChange={(e) => handleUpdateLink(idx, 'label', e.target.value)}
                        className="w-1/3"
                        disabled={isPending}
                      />
                      <Input
                        placeholder="URL (https://...)"
                        type="url"
                        value={link.url}
                        onChange={(e) => handleUpdateLink(idx, 'url', e.target.value)}
                        className="flex-1"
                        disabled={isPending}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveLink(idx)}
                        disabled={isPending}
                        className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                        title="Hapus tautan ini"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Belum ada tautan tambahan.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Pengaturan Visibilitas Kontak (PROF-05) */}
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg">Visibilitas Kontak Publik</CardTitle>
            <CardDescription>
              Atur informasi kontak mana saja yang diizinkan tampil di portofolio publik Anda.
              Field yang dimatikan tidak akan pernah ditampilkan ke pengunjung situs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Show Email */}
              <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/20">
                <div className="space-y-0.5">
                  <Label htmlFor="switch-email" className="text-sm font-medium cursor-pointer">
                    Tampilkan Email
                  </Label>
                  <p className="text-xs text-muted-foreground">Izinkan pengunjung melihat alamat email Anda</p>
                </div>
                <Switch
                  id="switch-email"
                  checked={showEmail}
                  onCheckedChange={setShowEmail}
                  disabled={isPending}
                />
              </div>

              {/* Show Phone */}
              <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/20">
                <div className="space-y-0.5">
                  <Label htmlFor="switch-phone" className="text-sm font-medium cursor-pointer">
                    Tampilkan Nomor Telepon
                  </Label>
                  <p className="text-xs text-muted-foreground">Izinkan pengunjung melihat nomor telepon</p>
                </div>
                <Switch
                  id="switch-phone"
                  checked={showPhone}
                  onCheckedChange={setShowPhone}
                  disabled={isPending}
                />
              </div>

              {/* Show Location */}
              <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/20">
                <div className="space-y-0.5">
                  <Label htmlFor="switch-location" className="text-sm font-medium cursor-pointer">
                    Tampilkan Lokasi
                  </Label>
                  <p className="text-xs text-muted-foreground">Tampilkan kota atau negara domisili</p>
                </div>
                <Switch
                  id="switch-location"
                  checked={showLocation}
                  onCheckedChange={setShowLocation}
                  disabled={isPending}
                />
              </div>

              {/* Show LinkedIn */}
              <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/20">
                <div className="space-y-0.5">
                  <Label htmlFor="switch-linkedin" className="text-sm font-medium cursor-pointer">
                    Tampilkan Tautan LinkedIn
                  </Label>
                  <p className="text-xs text-muted-foreground">Tampilkan tombol profil LinkedIn</p>
                </div>
                <Switch
                  id="switch-linkedin"
                  checked={showLinkedin}
                  onCheckedChange={setShowLinkedin}
                  disabled={isPending}
                />
              </div>

              {/* Show GitHub */}
              <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/20 sm:col-span-2">
                <div className="space-y-0.5">
                  <Label htmlFor="switch-github" className="text-sm font-medium cursor-pointer">
                    Tampilkan Tautan GitHub
                  </Label>
                  <p className="text-xs text-muted-foreground">Tampilkan tombol profil GitHub di publik</p>
                </div>
                <Switch
                  id="switch-github"
                  checked={showGithub}
                  onCheckedChange={setShowGithub}
                  disabled={isPending}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit & Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={isPending}
            className="font-medium px-6 shadow-xs"
          >
            {isPending ? 'Menyimpan Perubahan...' : 'Simpan Profil'}
          </Button>
        </div>
      </form>
    </div>
  )
}
