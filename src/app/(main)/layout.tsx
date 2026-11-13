import { Header } from '@/components/layout'
import { LocationProvider } from '@/lib/context/LocationContext'
import { AuthPromptProvider } from '@/lib/context/AuthPromptContext'
import { SavedProvider } from '@/lib/context/SavedContext'
import { PlanProvider } from '@/lib/context/PlanContext'
import { AppPromptProvider } from '@/lib/context/AppPromptContext'
import { PlatformFlagsProvider } from '@/lib/context/PlatformFlagsContext'
import { getPlatformFlags } from '@/lib/services/platformFlags'
import { getCurrentUser } from '@/lib/services/user'
import { getUserPlan } from '@/lib/services/subscription'
import { getHeaderLocation } from '@/lib/location'
import { Suspense } from 'react'
import { FloatingModeNav } from '@/components/layout/FloatingModeNav/FloatingModeNav'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  const [plan, headerLocation, flags] = await Promise.all([getUserPlan(user?.id), getHeaderLocation(), getPlatformFlags()])

  return (
    <PlatformFlagsProvider flags={flags}>
    <LocationProvider initial={headerLocation}>
      <AuthPromptProvider>
        <SavedProvider>
          <PlanProvider plan={plan}>
          <AppPromptProvider>
            <Header />
            {/* pt clears the category-nav pill, which overhangs the header by ~38px
                (see translate-y / -mb in HeaderHeroNav) */}
            <div className="flex-1 w-full mx-auto max-w-7xl pt-2 md:pt-9.5">
              {children}
            </div>
            {/* useSearchParams needs a Suspense boundary to keep pages static-renderable */}
            <Suspense fallback={null}>
              <FloatingModeNav />
            </Suspense>
          </AppPromptProvider>
          </PlanProvider>
        </SavedProvider>
      </AuthPromptProvider>
    </LocationProvider>
    </PlatformFlagsProvider>
  )
}
