interface Props {
  icon: React.ReactNode
  heading: string
  description?: string
}

export function EmptyStateCard({ icon, heading, description }: Props) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white py-16 flex flex-col items-center gap-2 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-1">
        {icon}
      </div>
      <p className="text-sm font-semibold text-gray-500">{heading}</p>
      {description && <p className="text-xs text-gray-400 max-w-48">{description}</p>}
    </div>
  )
}
