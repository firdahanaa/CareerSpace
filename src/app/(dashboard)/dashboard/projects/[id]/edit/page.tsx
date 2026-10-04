import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAdminProjectById, getAdminSkillsForProfile } from '@/lib/queries/admin'
import { ProjectForm } from '@/components/forms/project-form'

export interface EditProjectPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditProjectPageProps): Promise<Metadata> {
  const { id } = await params
  const project = await getAdminProjectById(id)
  return {
    title: project ? `Edit ${project.title} — MyCareerSpace` : 'Edit Proyek — MyCareerSpace',
  }
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params
  const [project, skills] = await Promise.all([
    getAdminProjectById(id),
    getAdminSkillsForProfile(),
  ])

  if (!project) {
    notFound()
  }

  const initialData = {
    id: project.id,
    title: project.title,
    shortSummary: project.shortSummary,
    slug: project.slug,
    description: project.description,
    role: project.role,
    projectType: project.projectType,
    startDate: project.startDate,
    endDate: project.endDate,
    isOngoing: project.isOngoing,
    technologies: project.technologies,
    responsibilities: project.responsibilities,
    outcomes: project.outcomes,
    repositoryUrl: project.repositoryUrl,
    demoUrl: project.demoUrl,
    coverImageUrl: project.coverImageUrl,
    featured: project.featured,
    published: project.published,
    skillIds: project.skills.map((s) => s.skill.id),
  }

  return (
    <div className="max-w-4xl mx-auto py-2">
      <ProjectForm
        mode="edit"
        initialData={initialData}
        availableSkills={skills}
      />
    </div>
  )
}
