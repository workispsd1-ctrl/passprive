import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | PassPrivé',
  description: 'Read the PassPrivé Terms of Service.',
}

const SECTIONS = [
  {
    heading: 'Acceptance of Terms',
    body: 'By accessing or using PassPrivé, you agree to be bound by these Terms of Service. If you do not agree to all terms and conditions, you must not use our platform. We reserve the right to update these terms at any time, and continued use of the platform constitutes acceptance of any changes.',
  },
  {
    heading: 'Services Overview',
    body: 'PassPrivé provides a platform that allows users to discover restaurants and stores, make dining reservations, and access exclusive member offers across Mauritius. We act solely as an intermediary between users and participating venues. Actual service quality is the responsibility of the individual venues.',
  },
  {
    heading: 'Eligibility',
    body: 'You must be at least 18 years of age to create an account and use the platform. By registering, you confirm that the information you provide is accurate and complete. Accounts may not be transferred to another person without prior written consent from PassPrivé.',
  },
  {
    heading: 'Bookings & Cancellations',
    body: 'Dining reservations made through PassPrivé are subject to each venue\'s individual cancellation and modification policies, which are displayed at the time of booking. PassPrivé is not liable for any losses arising from a venue\'s failure to honour a booking or a user\'s failure to cancel within the permitted window.',
  },
  {
    heading: 'User Conduct',
    body: 'You agree to use the platform only for lawful purposes. You must not misuse the booking system, submit false reviews, or attempt to circumvent any security measures. PassPrivé reserves the right to suspend or terminate accounts that violate these standards without prior notice.',
  },
  {
    heading: 'Intellectual Property',
    body: 'All content on PassPrivé, including logos, text, images, and software, is the property of PassPrivé or its licensors and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without express written permission.',
  },
  {
    heading: 'Limitation of Liability',
    body: 'To the maximum extent permitted by law, PassPrivé shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform or inability to access the platform. Our total liability shall not exceed the amounts paid by you to PassPrivé in the twelve months preceding the claim.',
  },
  {
    heading: 'Governing Law',
    body: 'These Terms are governed by the laws of the Republic of Mauritius. Any disputes shall be subject to the exclusive jurisdiction of the courts of Mauritius.',
  },
]

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-8">Terms of Service</h1>

        <p className="text-sm text-gray-500 mb-10">
          Last updated on May 01, 2026.<br />
          Thank you for using PassPrivé.
        </p>

        {SECTIONS.map(({ heading, body }, i) => (
          <section key={i} className="mb-8">
            <h2 className="text-base font-bold text-gray-900 mb-3">{heading}</h2>
            <p className="text-sm text-gray-700 leading-relaxed">{body}</p>
          </section>
        ))}
      </div>
    </main>
  )
}
