import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SupportForm } from './SupportForm'

export const metadata: Metadata = {
  title: 'Support | PassPrivé',
  description: 'Get help with your PassPrivé bookings and account.',
}

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-10">
          How can we help you?
        </h1>
        <Suspense>
          <SupportForm />
        </Suspense>
      </div>
    </main>
  )
}
