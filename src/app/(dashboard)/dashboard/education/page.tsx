import type { Metadata } from 'next'
import { getAdminEducations } from '@/lib/queries/admin'
import { EducationListTable } from '@/components/dashboard/education-list-table'

export const metadata: Metadata = {
  title: 'Pendidikan — MyCareerSpace',
  description: 'Kelola riwayat pendidikan formal, gelar, institusi, dan pencapaian akademik.',
}

export default async function EducationPage() {
  const data = await getAdminEducations()

  return (
    <div className="space-y-6">
      <EducationListTable
        initialEducations={data.educations}
        stats={{
          total: data.totalCount,
          published: data.publishedCount,
          private: data.privateCount,
        }}
      />
    </div>
  )
}
