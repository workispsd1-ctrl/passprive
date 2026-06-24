import { QrCode } from 'lucide-react'

export function DownloadAppCard() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 flex items-start gap-3">
      <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
        <QrCode className="w-9 h-9 text-gray-400" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900">Download PassPrivé</p>
        <ul className="mt-1.5 space-y-1">
          {['Exclusive offers and deals', 'Pay via District'].map(t => (
            <li key={t} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-1 h-1 rounded-full bg-gray-400 shrink-0" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
