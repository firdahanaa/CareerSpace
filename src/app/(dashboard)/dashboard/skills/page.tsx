import type { Metadata } from 'next'
import { getAdminSkillsGroupedByCategory } from '@/lib/queries/admin'
import { SkillListView } from '@/components/dashboard/skill-list-view'

export const metadata: Metadata = {
  title: 'Skills — MyCareerSpace',
  description: 'Kelola taksonomi keahlian teknis, analitis, bisnis, interpersonal, dan bahasa Anda.',
}

export default async function SkillsPage() {
  const data = await getAdminSkillsGroupedByCategory()

  return (
    <div className="space-y-6">
      <SkillListView
        groups={data.groups}
        stats={{
          total: data.totalSkills,
          published: data.publishedSkills,
          private: data.privateSkills,
        }}
      />
    </div>
  )
}
