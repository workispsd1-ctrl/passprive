import Link from 'next/link'
import { Wallet, CreditCard, ArrowRight } from 'lucide-react'

interface Props {
  bookingId: string
  cashbackRate: number
}

export function PayBillCard({ bookingId, cashbackRate }: Props) {
  return (
    <div className="rounded-2xl bg-linear-to-br from-violet-600 to-purple-700 p-5 text-white">
      <div className="flex items-center gap-2 mb-1">
        <Wallet className="w-4 h-4 text-white/80" />
        <p className="text-sm font-bold">Pay Bill &amp; Earn PP Coins</p>
      </div>
      <p className="text-xs text-white/70 leading-relaxed mb-4">
        Pay your bill via card and earn {cashbackRate}% back as PP Coins.
      </p>
      <Link
        href={`/bookings/${bookingId}/pay`}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white text-violet-700 text-sm font-bold hover:bg-violet-50 transition-colors"
      >
        <CreditCard className="w-4 h-4" />
        Pay Bill &amp; Earn Coins
        <ArrowRight className="w-4 h-4" />
      </Link>
      <p className="text-[10px] text-white/40 text-center mt-2">Secured by iVeri · 3D Secure</p>
    </div>
  )
}
