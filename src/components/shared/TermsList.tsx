interface Props {
  items: string[]
  className?: string
}

export function TermsList({ items, className = '' }: Props) {
  return (
    <ul className={`flex flex-col gap-2 ${className}`}>
      {items.map(item => (
        <li key={item} className="flex items-start gap-2 text-xs text-gray-500 leading-relaxed">
          <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  )
}
