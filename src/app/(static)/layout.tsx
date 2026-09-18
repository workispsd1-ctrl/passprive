import Image from 'next/image'
import Link from 'next/link'

export default function SimpleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="flex justify-center py-5 border-b border-gray-200">
        <Link href="/" aria-label="PassPrive home">
          <Image
            src="/logo-dark.png"
            alt="PassPrive"
            width={280}
            height={67}
            className="h-16 w-auto object-contain"
          />
        </Link>
      </header>
      <div className="flex-1">
        {children}
      </div>
    </>
  )
}
