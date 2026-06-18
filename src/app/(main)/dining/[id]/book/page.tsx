import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin } from 'lucide-react'
import { getRestaurantBySlugOrId } from '@/lib/services/dining'
import { createClient } from '@/lib/supabase/server'
import { BookingWidget } from '@/components/sections/dining/BookingWidget'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const { restaurant } = await getRestaurantBySlugOrId(id)
  if (!restaurant) return {}
  return { title: `Book a Table · ${restaurant.name} | PassPrivé` }
}

export default async function BookTablePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [{ restaurant }, supabase] = await Promise.all([
    getRestaurantBySlugOrId(id),
    createClient(),
  ])
  if (!restaurant) notFound()
  if (!restaurant.booking_enabled) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  let defaultName = ''
  let defaultPhone = ''
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('full_name, phone')
      .eq('id', user.id)
      .single()
    defaultName = profile?.full_name ?? user.user_metadata?.full_name ?? ''
    defaultPhone = profile?.phone ?? ''
  }

  const location = [restaurant.area, restaurant.city].filter(Boolean).join(', ')
  const backHref = `/dining/${restaurant.slug ?? restaurant.id}`
  const address = restaurant.full_address ?? location

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Restaurant header — full width */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href={backHref} className="text-gray-400 hover:text-gray-700 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-200 shrink-0">
            {restaurant.cover_image && (
              <Image
                src={restaurant.cover_image}
                alt={restaurant.name}
                fill
                className="object-cover"
                sizes="56px"
                priority
              />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-extrabold text-gray-900 leading-tight truncate">{restaurant.name}</h1>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {restaurant.cost_for_two && <span>₹{restaurant.cost_for_two} for two</span>}
              {restaurant.cost_for_two && address && <span className="mx-1.5 text-gray-300">|</span>}
              {address && <span className="flex-1">{address}</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Booking widget */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <BookingWidget
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          restaurantLocation={address}
          backHref={backHref}
          defaultName={defaultName}
          defaultPhone={defaultPhone}
        />
      </div>
    </main>
  )
}
