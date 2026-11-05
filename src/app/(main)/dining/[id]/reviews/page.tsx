import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllRestaurantReviews, getRestaurantBySlugOrId } from '@/lib/services/dining'
import { AllReviewsClient } from '@/components/sections/dining/AllReviewsClient'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const { restaurant } = await getRestaurantBySlugOrId(id)
  return restaurant ? { title: `Reviews · ${restaurant.name} | PassPrivé` } : {}
}

export default async function AllReviewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { restaurant, reviewSummary } = await getRestaurantBySlugOrId(id)
  if (!restaurant) notFound()
  const reviews = await getAllRestaurantReviews(restaurant.id)
  return <AllReviewsClient backHref={`/dining/${restaurant.slug ?? restaurant.id}`} name={restaurant.name} average={reviewSummary.avg} reviews={reviews} />
}
