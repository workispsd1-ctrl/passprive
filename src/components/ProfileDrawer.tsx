'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BookText, MessageSquareText, HelpCircle, FileText, LogOut, Wallet, Crown } from 'lucide-react'
import Link from 'next/link'

interface Props {
  open: boolean
  onClose: () => void
  user: { email?: string; name?: string | null; phone?: string | null }
}

function getInitial(name?: string | null, email?: string) {
  if (name?.trim()) return name.trim()[0].toUpperCase()
  if (email) return email[0].toUpperCase()
  return 'U'
}

function getDisplayName(name?: string | null, email?: string) {
  if (name?.trim()) return name.trim()
  return email?.split('@')[0] ?? 'User'
}

export function ProfileDrawer({ open, onClose, user }: Props) {
  const router = useRouter()

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  async function handleLogout() {
    const res = await fetch('/api/auth/signout', { method: 'POST' })
    if (!res.ok) return
    onClose()
    router.refresh()
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-gray-100 flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center gap-3 bg-white px-4 py-4 border-b border-gray-100">
          <button type="button" aria-label="Close profile" onClick={onClose} className="p-1 -ml-1 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <span className="text-base font-bold text-gray-900">Profile</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4">

          <div className="flex items-center gap-4 bg-white rounded-2xl px-4 py-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-violet-200 flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-violet-700">
                {getInitial(user.name, user.email)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-gray-900 truncate">
                {getDisplayName(user.name, user.email)}
              </p>
              <p className="text-sm text-gray-500 truncate mt-0.5">
                {user.phone ?? user.email}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
            <Link
              href="/bookings"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors"
            >
              <BookText className="w-5 h-5 text-gray-500 shrink-0" />
              <span className="flex-1 text-sm font-medium text-gray-800">View all bookings</span>
              <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
            </Link>
            <Link
              href="/wallet"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors"
            >
              <Wallet className="w-5 h-5 text-gray-500 shrink-0" />
              <span className="flex-1 text-sm font-medium text-gray-800">My Wallet</span>
              <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
            </Link>
            <Link
              href="/membership"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors"
            >
              <Crown className="w-5 h-5 text-gray-500 shrink-0" />
              <span className="flex-1 text-sm font-medium text-gray-800">Membership</span>
              <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
            </Link>
          </div>

          <div>
            <p className="text-sm font-bold text-gray-900 mb-2 px-1">Support</p>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <Link
                href="/support"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors"
              >
                <MessageSquareText className="w-5 h-5 text-gray-500 shrink-0" />
                <span className="flex-1 text-sm font-medium text-gray-800">Chat with us</span>
                <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
              </Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-gray-900 mb-2 px-1">More</p>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
              <Link
                href="/terms"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors"
              >
                <HelpCircle className="w-5 h-5 text-gray-500 shrink-0" />
                <span className="flex-1 text-sm font-medium text-gray-800">Terms &amp; Conditions</span>
                <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
              </Link>
              <Link
                href="/privacy"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-5 h-5 text-gray-500 shrink-0" />
                <span className="flex-1 text-sm font-medium text-gray-800">Privacy Policy</span>
                <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-4 hover:bg-gray-50 transition-colors text-left"
            >
              <LogOut className="w-5 h-5 text-gray-500 shrink-0" />
              <span className="text-sm font-medium text-gray-800">Logout</span>
            </button>
          </div>

        </div>
      </div>
    </>
  )
}
