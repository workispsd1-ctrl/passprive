import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getUserCoords } from '@/lib/location'
import { getMallBySlugOrId, getMallPlaces } from '@/lib/services/malls'
import { MallDetailClient } from '@/components/sections/malls/MallDetailClient'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const mall = await getMallBySlugOrId(id)
  return mall ? { title: `${mall.name} | PassPrivé` } : {}
}

export default async function MallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const coords = await getUserCoords()
  const mall = await getMallBySlugOrId(id, coords)
  if (!mall) notFound()
  const places = await getMallPlaces(mall, coords)
  return <MallDetailClient mall={mall} places={places} />
}
