import type { Metadata } from 'next'
import { PolicyPage, type PolicySection } from '@/components/shared/PolicyPage'

export const metadata: Metadata = {
  title: 'Privacy Policy | PassPrivé',
  description: 'Read the PassPrivé Privacy Policy.',
}

const SECTIONS: PolicySection[] = [
  {
    title: 'Information We Collect',
    body: 'We collect information you provide directly when you register, make a booking, or contact support — including your name, email address, phone number, and payment details. We also collect usage data automatically, such as pages visited, device type, and IP address, to improve our services.',
  },
  {
    title: 'How We Use Your Information',
    body: 'Your information is used to process bookings, personalise your experience, send transactional and promotional communications (where you have consented), and improve platform performance. We do not sell your personal data to third parties.',
  },
  {
    title: 'Data Sharing',
    body: 'We share your booking details (name, party size, date) with the venue you are booking at, solely to fulfil the reservation. We may also share data with trusted service providers who assist in operating the platform, under strict confidentiality agreements. We will disclose information if required by law.',
  },
  {
    title: 'Cookies',
    body: 'PassPrivé uses cookies and similar technologies to maintain your session, remember preferences, and analyse traffic. You may control cookie settings through your browser, though some features may not function correctly if cookies are disabled.',
  },
  {
    title: 'Data Retention',
    body: 'We retain your personal data for as long as your account is active or as necessary to provide services and comply with legal obligations. You may request deletion of your account and associated data at any time by contacting us at support@passprive.com.',
  },
  {
    title: 'Your Rights',
    body: 'Under applicable data protection law, you have the right to access, correct, or delete your personal data, object to or restrict processing, and request data portability. To exercise any of these rights, please contact us at support@passprive.com. We will respond within 30 days.',
  },
  {
    title: 'Security',
    body: 'We implement industry-standard technical and organisational measures to protect your personal data against unauthorised access, loss, or disclosure. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security.',
  },
  {
    title: 'Contact',
    body: 'If you have questions or concerns about this Privacy Policy, please contact our data protection team at support@passprive.com or write to us at PassPrivé, Port Louis, Mauritius.',
  },
  // app parity: TermsPoliciesScreen.jsx sections the website didn't cover
  {
    title: "User Consent",
    body: "By proceeding with payment, creating an account, or using PassPriv\u00e9 services, you provide consent to the applicable terms, policies, billing practices, and data handling requirements needed to deliver the service.",
  },
  {
    title: "Information Disclosure",
    body: "PassPriv\u00e9 may disclose limited user information to payment processors, merchants, technical partners, and legal authorities only where required to complete transactions, provide booked services, prevent fraud, or comply with applicable law.",
  },
]

export default function PrivacyPage() {
  return <PolicyPage title='Privacy Policy' updated='July 24, 2026' sections={SECTIONS} />
}
