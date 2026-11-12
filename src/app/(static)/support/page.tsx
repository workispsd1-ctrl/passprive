import type { Metadata } from 'next'
import { PageBackTitle } from '@/components/shared/PolicyPage'
import { getCurrentUser } from '@/lib/services/user'
import { SupportChat } from './SupportChat'

export const metadata: Metadata = {
  title: 'Chat with us | PassPrivé',
  description: 'Chat with PassPrivé support about your bookings, payments and account.',
}

/** App parity: screens/SupportChatScreen.jsx — "Chat with us". */
export default async function SupportPage() {
  const user = await getCurrentUser()
  const fullName = user?.name?.trim() || ''
  return (
    <main className='flex h-[calc(100dvh-4rem)] flex-col bg-white px-4 pt-6 pb-4 font-(family-name:--font-dm-sans) md:h-[calc(100dvh-6rem)]'>
      <div className='mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col'>
        <PageBackTitle title='Chat with us' />
        <SupportChat
          user={user ? { fullName, firstName: (fullName || user.email || 'You').split(' ')[0], email: user.email ?? '', phone: user.phone ?? '' } : null}
        />
      </div>
    </main>
  )
}
