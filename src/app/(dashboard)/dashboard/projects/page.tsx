import type { Metadata } from 'next'
import { getAdminProjects } from '@/lib/queries/admin'
import { ProjectListTable } from '@/components/dashboard/project-list-table'

export const metadata: Metadata = {
  title: 'Projects — MyCareerSpace',
  description: 'Kelola rekam jejak portofolio proyek akademik, profesional, freelance, dan organisasi Anda.',
}

export default async function ProjectsPage() {
  const data = await getAdminProjects()

  return (
    <div className="space-y-6">
      <ProjectListTable
        initialProjects={data.projects}
        stats={{
          total: data.totalCount,
          published: data.publishedCount,
          private: data.privateCount,
          featured: data.featuredCount,
        }}
      />
    </div>
  )
}
