import { Header, Footer } from '@/components/layout'
import { LocationProvider } from '@/lib/context/LocationContext'
import { AuthPromptProvider } from '@/lib/context/AuthPromptContext'
import { SavedProvider } from '@/lib/context/SavedContext'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocationProvider>
      <AuthPromptProvider>
        <SavedProvider>
          <Header />
          {/* pt clears the category-nav pill, which overhangs the header by ~38px
              (see translate-y / -mb in HeaderHeroNav) */}
          <div className="flex-1 w-full mx-auto max-w-7xl pt-9.5">
            {children}
          </div>
          <Footer />
        </SavedProvider>
      </AuthPromptProvider>
    </LocationProvider>
  )
}
