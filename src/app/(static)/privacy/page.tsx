import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | PassPrivé',
  description: 'Read the PassPrivé Privacy Policy.',
}

const SECTIONS = [
  {
    heading: 'Information We Collect',
    body: 'We collect information you provide directly when you register, make a booking, or contact support — including your name, email address, phone number, and payment details. We also collect usage data automatically, such as pages visited, device type, and IP address, to improve our services.',
  },
  {
    heading: 'How We Use Your Information',
    body: 'Your information is used to process bookings, personalise your experience, send transactional and promotional communications (where you have consented), and improve platform performance. We do not sell your personal data to third parties.',
  },
  {
    heading: 'Data Sharing',
    body: 'We share your booking details (name, party size, date) with the venue you are booking at, solely to fulfil the reservation. We may also share data with trusted service providers who assist in operating the platform, under strict confidentiality agreements. We will disclose information if required by law.',
  },
  {
    heading: 'Cookies',
    body: 'PassPrivé uses cookies and similar technologies to maintain your session, remember preferences, and analyse traffic. You may control cookie settings through your browser, though some features may not function correctly if cookies are disabled.',
  },
  {
    heading: 'Data Retention',
    body: 'We retain your personal data for as long as your account is active or as necessary to provide services and comply with legal obligations. You may request deletion of your account and associated data at any time by contacting us at support@passprive.com.',
  },
  {
    heading: 'Your Rights',
    body: 'Under applicable data protection law, you have the right to access, correct, or delete your personal data, object to or restrict processing, and request data portability. To exercise any of these rights, please contact us at support@passprive.com. We will respond within 30 days.',
  },
  {
    heading: 'Security',
    body: 'We implement industry-standard technical and organisational measures to protect your personal data against unauthorised access, loss, or disclosure. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security.',
  },
  {
    heading: 'Contact',
    body: 'If you have questions or concerns about this Privacy Policy, please contact our data protection team at support@passprive.com or write to us at PassPrivé, Port Louis, Mauritius.',
  },
]

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-8">Privacy Policy</h1>

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
