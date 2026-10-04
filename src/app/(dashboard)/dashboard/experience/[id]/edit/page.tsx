import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAdminExperienceById, getAdminSkillsForProfile } from '@/lib/queries/admin'
import { ExperienceForm } from '@/components/forms/experience-form'

export interface EditExperiencePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditExperiencePageProps): Promise<Metadata> {
  const { id } = await params
  const experience = await getAdminExperienceById(id)
  return {
    title: experience
      ? `Edit ${experience.position} di ${experience.organization} — MyCareerSpace`
      : 'Edit Pengalaman — MyCareerSpace',
  }
}

export default async function EditExperiencePage({ params }: EditExperiencePageProps) {
  const { id } = await params
  const [experience, skills] = await Promise.all([
    getAdminExperienceById(id),
    getAdminSkillsForProfile(),
  ])

  if (!experience) {
    notFound()
  }

  const initialData = {
    id: experience.id,
    organization: experience.organization,
    position: experience.position,
    category: experience.category,
    location: experience.location,
    startDate: experience.startDate,
    endDate: experience.endDate,
    isCurrent: experience.isCurrent,
    description: experience.description,
    responsibilities: experience.responsibilities,
    achievements: experience.achievements,
    published: experience.published,
    skillIds: experience.skills.map((s) => s.skill.id),
  }

  return (
    <div className="max-w-4xl mx-auto py-2">
      <ExperienceForm
        mode="edit"
        initialData={initialData}
        availableSkills={skills}
      />
    </div>
  )
}
