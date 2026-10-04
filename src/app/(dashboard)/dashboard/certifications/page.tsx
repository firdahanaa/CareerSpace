import type { Metadata } from 'next'
import { getAdminCertifications } from '@/lib/queries/admin'
import { CertificationListTable } from '@/components/dashboard/certification-list-table'

export const metadata: Metadata = {
  title: 'Sertifikasi & Pencapaian — MyCareerSpace',
  description: 'Kelola sertifikasi profesional, lisensi, penghargaan, dan pencapaian karier Anda.',
}

export default async function CertificationsPage() {
  const data = await getAdminCertifications()

  return (
    <div className="space-y-6">
      <CertificationListTable
        initialCertifications={data.certifications}
        stats={{
          total: data.totalCount,
          published: data.publishedCount,
          private: data.privateCount,
        }}
      />
    </div>
  )
}
