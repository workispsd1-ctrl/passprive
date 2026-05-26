import {
  AppCTASection,
  BookSection,
  DiscoverSection,
  HeroSection,
  PaySection,
} from '@/components/sections'

export default function Dining() {
  return (
    <main>
      <HeroSection />
      {/* <FeaturedRestaurantsSection /> */}
      <DiscoverSection />
      <BookSection />
      <PaySection />
      <AppCTASection />
    </main>
  )
}
