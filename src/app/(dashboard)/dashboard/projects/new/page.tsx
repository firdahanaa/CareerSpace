import type { Metadata } from 'next'
import { getAdminSkillsForProfile } from '@/lib/queries/admin'
import { ProjectForm } from '@/components/forms/project-form'

export const metadata: Metadata = {
  title: 'Tambah Proyek Baru — MyCareerSpace',
  description: 'Tambahkan proyek baru ke portofolio dan rekam jejak karier Anda.',
}

export default async function NewProjectPage() {
  const skills = await getAdminSkillsForProfile()

  return (
    <div className="max-w-4xl mx-auto py-2">
      <ProjectForm mode="create" availableSkills={skills} />
    </div>
  )
}
