import type { Metadata } from 'next'
import { PolicyPage, type PolicySection } from '@/components/shared/PolicyPage'

export const metadata: Metadata = {
  title: 'Terms of Service | PassPrivé',
  description: 'Read the PassPrivé Terms of Service.',
}

const SECTIONS: PolicySection[] = [
  {
    title: 'Acceptance of Terms',
    body: 'By accessing or using PassPrivé, you agree to be bound by these Terms of Service. If you do not agree to all terms and conditions, you must not use our platform. We reserve the right to update these terms at any time, and continued use of the platform constitutes acceptance of any changes.',
  },
  {
    title: 'Services Overview',
    body: 'PassPrivé provides a platform that allows users to discover restaurants and stores, make dining reservations, and access exclusive member offers across Mauritius. We act solely as an intermediary between users and participating venues. Actual service quality is the responsibility of the individual venues.',
  },
  {
    title: 'Eligibility',
    body: 'You must be at least 18 years of age to create an account and use the platform. By registering, you confirm that the information you provide is accurate and complete. Accounts may not be transferred to another person without prior written consent from PassPrivé.',
  },
  {
    title: 'Bookings & Cancellations',
    body: 'Dining reservations made through PassPrivé are subject to each venue\'s individual cancellation and modification policies, which are displayed at the time of booking. PassPrivé is not liable for any losses arising from a venue\'s failure to honour a booking or a user\'s failure to cancel within the permitted window.',
  },
  {
    title: 'User Conduct',
    body: 'You agree to use the platform only for lawful purposes. You must not misuse the booking system, submit false reviews, or attempt to circumvent any security measures. PassPrivé reserves the right to suspend or terminate accounts that violate these standards without prior notice.',
  },
  {
    title: 'Intellectual Property',
    body: 'All content on PassPrivé, including logos, text, images, and software, is the property of PassPrivé or its licensors and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without express written permission.',
  },
  {
    title: 'Limitation of Liability',
    body: 'To the maximum extent permitted by law, PassPrivé shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform or inability to access the platform. Our total liability shall not exceed the amounts paid by you to PassPrivé in the twelve months preceding the claim.',
  },
  {
    title: 'Governing Law',
    body: 'These Terms are governed by the laws of the Republic of Mauritius. Any disputes shall be subject to the exclusive jurisdiction of the courts of Mauritius.',
  },
  // app parity: TermsPoliciesScreen.jsx sections the website didn't cover
  {
    title: "Refund & Return Policy",
    body: "Payments made for confirmed bookings are generally non-refundable unless a refund is required by law or explicitly approved by PassPriv\u00e9 support. Any approved refund is processed back to the original payment method and may take additional processing time based on your bank or card provider.",
  },
  {
    title: "Cancellation Policy",
    body: "You are responsible for cancelling bookings within the cancellation window shown at booking time. Late cancellations or no-shows may attract cancellation charges and can make the booking non-refundable. Merchant-side closures or unavailable services may be rescheduled or refunded at PassPriv\u00e9 discretion.",
  },
  {
    title: "Membership Start Date",
    body: "Your membership starts on the date and time your payment is successfully confirmed by PassPriv\u00e9. Any trial, introductory access, or paid benefits become active only after successful confirmation of the subscription transaction.",
  },
  {
    title: "Subscription Confirmation",
    body: "After successful payment, a subscription confirmation is generated in your account records and may also be shown on-screen or shared through registered communication channels. You should review these details for plan type, start date, and billing amount.",
  },
  {
    title: "Subscription Cancellation",
    body: "You may request subscription cancellation as per the applicable plan terms. Cancellation requests generally stop future renewals and do not automatically guarantee refunds for already billed periods unless required by law or explicitly approved under PassPriv\u00e9 policy.",
  },
  {
    title: "Contact & Grievance",
    body: "For any policy clarification, dispute, or grievance, please contact support through the Help & Support section of your profile.",
  },
]

export default function TermsPage() {
  return <PolicyPage title='Terms of Service' updated='July 24, 2026' sections={SECTIONS} />
}
