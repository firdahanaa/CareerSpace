import { PagePlaceholder } from '@/components/dashboard/page-placeholder'
import { Settings } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings — MyCareerSpace',
}

export default function SettingsPage() {
  return (
    <PagePlaceholder
      title="Settings"
      description="Kelola akun administrator, kata sandi, dan preferensi sistem MyCareerSpace."
      icon={Settings}
    />
  )
}
