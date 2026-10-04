import { PagePlaceholder } from '@/components/dashboard/page-placeholder'
import { FileText } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CV Manager — MyCareerSpace',
}

export default function CvsPage() {
  return (
    <PagePlaceholder
      title="CVs"
      description="Konfigurasi CV berbasis peran (target role), pilih konten dari basis data karier, dan ekspor ke PDF ramah ATS."
      icon={FileText}
    />
  )
}
