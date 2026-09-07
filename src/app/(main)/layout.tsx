import { Header, Footer } from '@/components/layout'
import { LocationProvider } from '@/lib/context/LocationContext'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocationProvider>
      <Header />
      {/* pt clears the category-nav pill, which overhangs the header by ~38px
          (see translate-y / -mb in HeaderHeroNav) */}
      <div className="flex-1 w-full mx-auto max-w-7xl pt-9.5">
        {children}
      </div>
      <Footer />
    </LocationProvider>
  )
}
