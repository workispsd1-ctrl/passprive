import { Header } from '@/components/layout'

/** FAQs, terms, privacy, support: the site header; each page has its own app-style title row. */
export default function SimpleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header minimal />
      <div className="flex-1">
        {children}
      </div>
    </>
  )
}
