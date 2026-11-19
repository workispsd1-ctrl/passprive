import type { Metadata } from 'next'
import { ResetPasswordForm } from './ResetPasswordForm'
import { getCurrentUser } from '@/lib/services/user'

export const metadata: Metadata = {
  title: 'Reset password | PassPrivé',
  robots: { index: false, follow: false },
}

/** Landing page of the "Forgot password?" email (via /api/auth/callback, which signs the link in). */
export default async function ResetPasswordPage() {
  const user = await getCurrentUser()
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-white px-4 py-12">
      <ResetPasswordForm hasSession={!!user} />
    </main>
  )
}
