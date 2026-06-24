import { CheckCircle2, AlertTriangle, Info } from 'lucide-react'

interface Props {
  status: 'success' | 'warning' | 'info'
  title: string
  subtitle?: string
  children?: React.ReactNode
}

const STYLES = {
  success: { wrap: 'bg-green-50 border-green-100', icon: 'text-green-500', title: 'text-green-700', sub: 'text-green-600' },
  warning: { wrap: 'bg-amber-50 border-amber-100', icon: 'text-amber-500', title: 'text-amber-700', sub: 'text-amber-600' },
  info:    { wrap: 'bg-violet-50 border-violet-100', icon: 'text-violet-500', title: 'text-violet-700', sub: 'text-violet-500' },
}

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
}

export function StatusBanner({ status, title, subtitle, children }: Props) {
  const s = STYLES[status]
  const Icon = ICONS[status]
  return (
    <div className={`border rounded-2xl p-4 ${s.wrap}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${s.icon}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${s.title}`}>{title}</p>
          {subtitle && <p className={`text-xs mt-0.5 ${s.sub}`}>{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  )
}
