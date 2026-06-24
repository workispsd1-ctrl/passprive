interface Props {
  code: string
}

export function BookingCodeBar({ code }: Props) {
  return (
    <div className="mt-2 rounded-2xl bg-gray-900 text-white px-6 py-4 flex items-center justify-center gap-4">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className={`bg-white h-8 rounded-full ${i % 3 === 0 ? 'w-0.75' : i % 2 === 0 ? 'w-0.5' : 'w-px'}`}
          />
        ))}
      </div>
      <p className="font-mono text-xl font-extrabold tracking-widest shrink-0">{code}</p>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className={`bg-white h-8 rounded-full ${i % 2 === 0 ? 'w-0.5' : 'w-px'}`}
          />
        ))}
      </div>
    </div>
  )
}
