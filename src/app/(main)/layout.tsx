import { Header } from '@/components/layout'
import { LocationProvider } from '@/lib/context/LocationContext'
import { AuthPromptProvider } from '@/lib/context/AuthPromptContext'
import { SavedProvider } from '@/lib/context/SavedContext'
import { PlanProvider } from '@/lib/context/PlanContext'
import { getCurrentUser } from '@/lib/services/user'
import { getUserPlan } from '@/lib/services/subscription'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  const plan = await getUserPlan(user?.id)

  return (
    <LocationProvider>
      <AuthPromptProvider>
        <SavedProvider>
          <PlanProvider plan={plan}>
            <Header />
            {/* pt clears the category-nav pill, which overhangs the header by ~38px
                (see translate-y / -mb in HeaderHeroNav) */}
            <div className="flex-1 w-full mx-auto max-w-7xl pt-9.5">
              {children}
            </div>
          </PlanProvider>
        </SavedProvider>
      </AuthPromptProvider>
    </LocationProvider>
  )
}
