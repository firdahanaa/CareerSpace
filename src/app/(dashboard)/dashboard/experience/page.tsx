import type { Metadata } from 'next'
import { getAdminExperiences } from '@/lib/queries/admin'
import { ExperienceListTable } from '@/components/dashboard/experience-list-table'

export const metadata: Metadata = {
  title: 'Pengalaman — MyCareerSpace',
  description: 'Kelola riwayat pekerjaan, magang, organisasi, sukarelawan, dan freelance Anda.',
}

export default async function ExperiencePage() {
  const data = await getAdminExperiences()

  return (
    <div className="space-y-6">
      <ExperienceListTable
        initialExperiences={data.experiences}
        stats={{
          total: data.totalCount,
          published: data.publishedCount,
          private: data.privateCount,
          categoryCounts: data.categoryCounts,
        }}
      />
    </div>
  )
}
