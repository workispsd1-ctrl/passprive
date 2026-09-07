interface Props {
  title: string
  className?: string
}

export function SectionHeader({ title, className = '' }: Props) {
  return (
    <div className={`px-4 md:px-6 ${className}`}>
      <h2 className="text-[18px] font-bold text-[#0D141C]">{title}</h2>
    </div>
  )
}
