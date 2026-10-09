import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SupportForm } from './SupportForm'
import { PageBackTitle } from '@/components/shared/PolicyPage'

export const metadata: Metadata = {
  title: 'Support | PassPrivé',
  description: 'Get help with your PassPrivé bookings and account.',
}

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-white px-4 pt-6 pb-12 font-(family-name:--font-dm-sans)">
      <div className="max-w-4xl mx-auto">
        <PageBackTitle title="Help & Support" />
        <p className="mt-6 mb-8 text-center text-[18px] font-bold text-[#2C2D32]">How can we help you?</p>
        <Suspense>
          <SupportForm />
        </Suspense>
      </div>
    </main>
  )
}
