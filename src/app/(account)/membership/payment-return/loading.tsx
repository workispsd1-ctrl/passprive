import { PaymentLoadingScreen } from '@/components/shared/PaymentLoadingScreen'

/** The page opens on the same verifying screen, so loading shows it straight away. */
export default function Loading() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center bg-white px-4' aria-busy='true'>
      <PaymentLoadingScreen />
    </main>
  )
}
