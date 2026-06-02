import type { Metadata } from 'next'
import {
  AppCTASection,
  BookSection,
  DiscoverSection,
  HeroSection,
  PaySection,
} from '@/components/sections'

export const metadata: Metadata = {
  title: 'Dining Deals & Restaurants',
  description:
    'Explore top restaurants with exclusive dining deals, table bookings, and member discounts. Discover the best places to eat near you with PassPrivé.',
  openGraph: {
    title: 'Dining Deals & Restaurants | PassPrivé',
    description:
      'Find exclusive dining deals, book tables, and discover top restaurants near you.',
    url: '/dining',
  },
  alternates: {
    canonical: '/dining',
  },
}

export default function Dining() {
  return (
    <main>
      <HeroSection />
      <DiscoverSection />
      <BookSection />
      <PaySection />
      <AppCTASection />
    </main>
  )
}
