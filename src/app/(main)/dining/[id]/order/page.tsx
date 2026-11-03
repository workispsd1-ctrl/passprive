import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getOrderCollect, getRestaurantBySlugOrId } from '@/lib/services/dining'
import { OrderCollectClient } from '@/components/sections/dining/order/OrderCollectClient'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const { restaurant } = await getRestaurantBySlugOrId(id)
  return restaurant ? { title: `Order & Collect · ${restaurant.name} | PassPrivé` } : {}
}

export default async function OrderCollectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { restaurant } = await getRestaurantBySlugOrId(id)
  if (!restaurant) notFound()
  const { enabled, items } = await getOrderCollect(restaurant.id)
  if (!items.length) notFound()
  return <OrderCollectClient restaurant={restaurant} items={items} browseOnly={!enabled} />
}
