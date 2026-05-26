import Link from 'next/link'
import Image from 'next/image'
import {
  FaGlobe, FaShareNodes, FaAt,
  FaBullhorn, FaThumbsUp, FaCamera, FaPlay,
  FaGooglePlay, FaApple, FaGoogle, FaFacebook,
  FaWhatsapp, FaInstagram, FaYoutube,
} from 'react-icons/fa6'
import { MdOutlineQrCodeScanner } from 'react-icons/md'
import { type IconType } from 'react-icons'

type FooterLink = { label: string; href: string }
type SocialLink = { label: string; href: string; Icon: IconType }

const LEGAL_LINKS: FooterLink[] = [
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
]

const SUPPORT_LINKS: FooterLink[] = [
  { label: 'Contact Us', href: '/contact' },
  { label: 'Help Center', href: '/help' },
]

const PARTNER_LINKS: FooterLink[] = [
  { label: 'List your events', href: '/list-events' },
  { label: 'Business Portal', href: '/business' },
]

const BRAND_SOCIAL: SocialLink[] = [
  { label: 'Website', href: '/', Icon: FaGlobe },
  { label: 'Share', href: '#', Icon: FaShareNodes },
  { label: 'Contact', href: '/contact', Icon: FaAt },
]

const BOTTOM_ICONS = [
  { label: 'Announcements', Icon: FaBullhorn },
  { label: 'Like', Icon: FaThumbsUp },
  { label: 'Photos', Icon: FaCamera },
  { label: 'Videos', Icon: FaPlay },
]

const MOBILE_NAV_LINKS: FooterLink[] = [
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'List your events', href: '/list-events' },
]

const MOBILE_APP_CIRCLES: SocialLink[] = [
  { label: 'Google Play', href: '#', Icon: FaGoogle },
  { label: 'App Store', href: '#', Icon: FaApple },
  { label: 'Facebook', href: '#', Icon: FaFacebook },
]

const MOBILE_SOCIAL_ICONS: SocialLink[] = [
  { label: 'WhatsApp', href: '#', Icon: FaWhatsapp },
  { label: 'Instagram', href: '#', Icon: FaInstagram },
  { label: 'Facebook', href: '#', Icon: FaFacebook },
  { label: 'YouTube', href: '#', Icon: FaYoutube },
]

function FooterNavColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[11px] font-bold text-gray-500 tracking-[0.18em] uppercase">{title}</p>
      <ul className="flex flex-col gap-3">
        {links.map(({ label, href }) => (
          <li key={href}>
            <Link
              href={href}
              className="text-[13px] text-gray-400 hover:text-white transition-colors"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer className='bg-[#161616] text-white mt-auto'>

      {/* Mobile layout */}
      <div className="md:hidden flex flex-col items-center gap-6 px-6 pt-10 pb-6">
        {/* Logo */}
        <Link href='/' aria-label='PassPrive home'>
          <Image
            src='/passpriveWhiteLogo.png'
            alt='PassPrive'
            width={140}
            height={60}
            className='h-14 w-auto object-contain'
          />
        </Link>

        {/* Nav links */}
        <nav className="flex flex-col items-center gap-3">
          {MOBILE_NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-[13px] text-gray-400 hover:text-white transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Download section */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-[11px] font-semibold text-gray-500 tracking-[0.18em] uppercase">
            Download the app
          </p>
          <div className="flex gap-3">
            <a
              href="#"
              aria-label="Download on Google Play"
              className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg px-4 py-2 text-[12px] font-semibold"
            >
              <FaGooglePlay size={13} aria-hidden="true" />
              Google Play
            </a>
            <a
              href="#"
              aria-label="Download on App Store"
              className="flex items-center gap-1.5 bg-sky-500/15 border border-sky-500/30 text-sky-400 rounded-lg px-4 py-2 text-[12px] font-semibold"
            >
              <FaApple size={13} aria-hidden="true" />
              App Store
            </a>
          </div>
        </div>

        {/* App store / social circles */}
        <div className="flex items-center gap-4">
          {MOBILE_APP_CIRCLES.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:bg-white/20 hover:text-white transition-colors"
            >
              <Icon size={14} aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="md:hidden border-t border-white/8 px-6 py-5">
        <p className="text-[10px] text-gray-500 leading-[1.7] text-center mb-4">
          By accessing this page, you confirm that you have read, understood, and agreed to our{' '}
          <Link href='/terms' className="underline hover:text-gray-400 transition-colors">Terms of Service</Link>
          ,{' '}
          <Link href='/cookies' className="underline hover:text-gray-400 transition-colors">Cookie Policy</Link>
          ,{' '}
          <Link href='/privacy' className="underline hover:text-gray-400 transition-colors">Privacy Policy</Link>
          , and Content Guidelines. All rights reserved. © PassPrive.
        </p>
        <div className="flex items-center justify-center gap-5">
          {MOBILE_SOCIAL_ICONS.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <Icon size={18} aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:block">
        {/* Main content */}
        <div className='mx-auto max-w-7xl px-6 pt-14 pb-10'>
          <div className='grid grid-cols-1 md:grid-cols-[220px_1fr_auto] gap-12 items-start'>
            {/* Brand column */}
            <div className='flex flex-col gap-4 w-fit'>
              <Link href='/' aria-label='PassPrive home'>
                <Image
                  src='/passpriveWhiteLogo.png'
                  alt='PassPrive'
                  width={220}
                  height={100}
                  className='h-22 w-auto object-contain'
                />
              </Link>
              <div className='flex items-center justify-between'>
                {BRAND_SOCIAL.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className='w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:bg-white/20 hover:text-white transition-colors'
                  >
                    <Icon size={13} aria-hidden='true' />
                  </a>
                ))}
              </div>
            </div>

            <div className='flex justify-end gap-20'>
              <div className='flex gap-x-14 md:pt-1'>
                <FooterNavColumn title='Legal' links={LEGAL_LINKS} />
                <FooterNavColumn title='Support' links={SUPPORT_LINKS} />
                <FooterNavColumn title='Partners' links={PARTNER_LINKS} />
              </div>

              <div className='flex flex-col items-start md:items-center gap-3 md:pt-1'>
                <div className='w-28 h-28 bg-white/8 border border-white/10 rounded-xl flex items-center justify-center'>
                  <MdOutlineQrCodeScanner
                    className='w-14 h-14 text-gray-400'
                    aria-hidden='true'
                  />
                </div>
                <p className='text-[11px] text-gray-500 text-center'>
                  Scan to download the app
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className='border-t m-4 p-8 border-white/8'>
          <div className='mx-auto max-w-7xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
            <p className='text-[11px] text-gray-400 leading-[1.7] max-w-xl'>
              By accessing this page, you confirm that you have read, understood,
              and agreed to our{' '}
              <Link href='/terms' className='underline hover:text-gray-400 transition-colors'>
                Terms of Service
              </Link>
              ,{' '}
              <Link href='/cookies' className='underline hover:text-gray-400 transition-colors'>
                Cookie Policy
              </Link>
              ,{' '}
              <Link href='/privacy' className='underline hover:text-gray-400 transition-colors'>
                Privacy Policy
              </Link>
              , and Content Guidelines. All rights reserved. © PassPrive.
            </p>
            <div className='flex items-center gap-4 shrink-0'>
              {BOTTOM_ICONS.map(({ label, Icon }) => (
                <span key={label} aria-label={label} className='text-gray-600'>
                  <Icon size={14} aria-hidden='true' />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
}
