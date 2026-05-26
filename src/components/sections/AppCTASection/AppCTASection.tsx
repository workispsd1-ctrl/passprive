import Image from 'next/image'
import { Download } from 'lucide-react'
import { MdOutlineQrCodeScanner } from 'react-icons/md'

export function AppCTASection() {
  return (
    <section className="bg-white py-6 px-4 md:py-16 md:px-6">
        {/* Dark purple gradient card */}
        <div className="relative rounded-3xl overflow-hidden bg-linear-to-br from-[#1e0d4a] via-[#150a38] to-[#0c0622] px-8 py-10 md:px-16 md:py-14">

          {/* Faint PP watermark top-right */}
          <div
            className="absolute -top-6 right-10 text-[200px] font-black text-white/4 leading-none select-none pointer-events-none tracking-tight"
            aria-hidden="true"
          >
            PP
          </div>

          {/* Mobile layout */}
          <div className="md:hidden relative z-10 flex flex-col items-center text-center gap-5">
            <div className="flex flex-col items-center gap-1">
              <Image
                src="/passpriveWhiteLogo.png"
                alt="PassPrive"
                width={140}
                height={60}
                className="h-14 w-auto object-contain"
              />
              <p className="text-[11px] text-white/50">Your Pass to the Island&apos;s Best.</p>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-extrabold text-white">
                Download the App
              </h2>
              <p className="text-[13px] text-white/70 leading-relaxed">
                Get exclusive deals and faster bookings on our mobile app
              </p>
            </div>
            <a
              href="#"
              className="flex items-center gap-2 bg-white text-gray-900 rounded-full px-6 py-3 text-sm font-bold hover:bg-gray-100 transition-colors"
            >
              <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
              Download PassPrivé App
            </a>
          </div>

          {/* Desktop layout */}
          <div className="hidden md:grid grid-cols-2 gap-12 items-center relative z-10">
            <div className="flex flex-col gap-5">
              <h2
                id="app-cta-heading"
                className="text-[38px] font-extrabold text-white leading-[1.15] tracking-tight"
              >
                The city&apos;s finest,
                <br />
                in your pocket.
              </h2>
              <p className="text-[13px] text-gray-300/80 leading-[1.75] max-w-80">
                Download the PassPrive app on your mobile device to discover, book,
                and pay for the best dining experiences seamlessly.
              </p>
            </div>

            <div className="flex flex-col items-center md:items-end gap-3">
              <div className="w-44 bg-white rounded-2xl flex items-center justify-center py-8 px-6 shadow-2xl">
                <MdOutlineQrCodeScanner
                  className="w-20 h-20 text-gray-700"
                  aria-hidden="true"
                />
              </div>
              <span className="text-[11px] font-bold text-white/70 tracking-[0.22em] uppercase">
                Download the App
              </span>
            </div>
          </div>

        </div>
    </section>
  )
}
