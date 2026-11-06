import { Loader2 } from 'lucide-react'

/** The page opens on the same "Confirming your gift…" screen, so loading shows it straight away. */
export default function Loading() {
  return (
    <main className='flex min-h-screen items-center justify-center bg-gray-50' aria-busy='true'>
      <div className='text-center'>
        <Loader2 className='mx-auto mb-4 h-10 w-10 animate-spin text-brand' />
        <p className='text-[15px] font-semibold text-gray-700'>Confirming your gift…</p>
        <p className='mt-1 text-[13px] text-gray-400'>Please don&apos;t close this page.</p>
      </div>
    </main>
  )
}
