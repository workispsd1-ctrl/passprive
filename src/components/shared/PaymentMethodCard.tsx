import { CreditCard } from 'lucide-react'

export function PaymentMethodCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-3">
      <CreditCard className="w-5 h-5 text-gray-400 shrink-0" />
      <div>
        <p className="text-sm font-semibold text-gray-800">Credit / Debit Card</p>
        <p className="text-xs text-gray-400 mt-0.5">Visa, Mastercard — secured by iVeri · 3D Secure</p>
      </div>
    </div>
  )
}
