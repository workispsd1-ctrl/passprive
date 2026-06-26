import Link from 'next/link'
import { Header, Footer } from '@/components/layout'

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center bg-white min-h-[70vh]">

        {/* Decorative circle */}
        <div className="w-24 h-24 rounded-full bg-orange-50 border-2 border-orange-100 flex items-center justify-center mb-8">
          <span className="text-5xl font-black text-orange-400">?</span>
        </div>

        <p className="text-[100px] font-black leading-none text-gray-100 select-none">404</p>

        <div className="-mt-4 mb-6">
          <p className="text-2xl font-extrabold text-gray-900">Page not found</p>
          <p className="text-sm text-gray-500 mt-2 max-w-sm leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/dining"
            className="inline-flex items-center justify-center px-8 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Browse Dining
          </Link>
        </div>

      </main>
      <Footer />
    </>
  )
}
