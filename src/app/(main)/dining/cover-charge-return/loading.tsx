import { DESIGN_UNIT, TYPE_SCALE } from '@/components/sections/dining/designUnit'
import { ProcessingScreen } from '@/components/sections/dining/PaymentScreens'
import { cn } from '@/lib/utils'

/** The page opens on the same processing screen, so loading shows it straight away. */
export default function Loading() {
  return (
    <main
      className={cn('flex min-h-screen flex-col items-center justify-center bg-white px-4 font-(family-name:--font-dm-sans) max-md:[--t:0.62px]', TYPE_SCALE)}
      style={{ ['--u' as string]: DESIGN_UNIT }}
      aria-busy='true'
    >
      <ProcessingScreen />
    </main>
  )
}
