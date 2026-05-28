import { Header, Footer } from '@/components/layout'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="flex-1 w-full mx-auto max-w-7xl">
        {children}
      </div>
      <Footer />
    </>
  )
}
