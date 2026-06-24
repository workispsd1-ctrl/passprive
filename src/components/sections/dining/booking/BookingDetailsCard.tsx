interface Props {
  name: string
  phone: string
  bookingId?: string
  transactionDate: string
}

export function BookingDetailsCard({ name, phone, bookingId, transactionDate }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <p className="text-sm font-bold text-gray-900 mb-3">Your details</p>
      <div className="flex items-center gap-3 py-2 border border-gray-100 rounded-xl px-3">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
          <span className="text-xs text-gray-500">👤</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{name}</p>
          <p className="text-xs text-gray-400">{phone}</p>
        </div>
      </div>
      {bookingId && (
        <div className="mt-3 flex flex-col gap-0.5">
          <p className="text-xs text-gray-400">Transaction ID: {bookingId}</p>
          <p className="text-xs text-gray-400">Transaction date: {transactionDate}</p>
        </div>
      )}
    </div>
  )
}
