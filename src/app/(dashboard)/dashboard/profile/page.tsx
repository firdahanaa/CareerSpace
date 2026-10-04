import { getAdminProfileData } from '@/lib/queries/admin'
import { ProfileForm } from '@/components/forms/profile-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kelola Profil — MyCareerSpace',
  description: 'Kelola informasi identitas profesional, kontak, dan tautan publik Anda.',
}

export default async function ProfileDashboardPage() {
  const { profile, settings } = await getAdminProfileData()

  return (
    <div className="max-w-4xl mx-auto py-2">
      <ProfileForm initialProfile={profile} initialSettings={settings} />
    </div>
  )
}
