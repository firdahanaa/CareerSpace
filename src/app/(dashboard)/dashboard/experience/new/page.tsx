import type { Metadata } from 'next'
import { getAdminSkillsForProfile } from '@/lib/queries/admin'
import { ExperienceForm } from '@/components/forms/experience-form'

export const metadata: Metadata = {
  title: 'Tambah Pengalaman Baru — MyCareerSpace',
  description: 'Tambahkan rekam jejak pekerjaan, magang, organisasi, atau proyek freelance baru.',
}

export default async function NewExperiencePage() {
  const skills = await getAdminSkillsForProfile()

  return (
    <div className="max-w-4xl mx-auto py-2">
      <ExperienceForm mode="create" availableSkills={skills} />
    </div>
  )
}
