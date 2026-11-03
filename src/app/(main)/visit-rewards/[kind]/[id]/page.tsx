import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getStampDetail } from '@/lib/services/visitRewards'
import { StampDetailView } from '@/components/sections/stamps/StampDetailView'

export const metadata: Metadata = { title: 'Stamp card | PassPrivé', robots: { index: false } }

export default async function StampDetailPage({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params
  const detail = await getStampDetail(kind, id)
  if (!detail) notFound()
  return <StampDetailView detail={detail} />
}
