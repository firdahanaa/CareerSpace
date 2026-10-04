import type { Metadata } from 'next'
import { getAdminPortfolioManagerData } from '@/lib/queries/admin'
import { PortfolioManagerView } from '@/components/dashboard/portfolio-manager-view'

export const metadata: Metadata = {
  title: 'Kelola Portofolio — MyCareerSpace',
  description: 'Kelola status publikasi, tautan web, dan kurasi rekaman portofolio publik Anda.',
}

export default async function PortfolioDashboardPage() {
  const data = await getAdminPortfolioManagerData()

  return <PortfolioManagerView data={data} />
}
