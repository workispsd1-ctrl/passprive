import Image from 'next/image'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { HScroll } from '@/components/sections/home/HScroll'
import { formatDistanceKm } from '@/lib/utils'
import { MALL_AMENITY_LABELS, mallAmenityKeys, type Mall } from '@/lib/malls'
import { AMENITY_ICONS } from './amenityIcons'

/** The malls rail — app parity: components/Home/MallsNearYou.jsx. */
export function MallsNearYou({ malls, title }: { malls: Mall[]; title: string }) {
  if (!malls.length) return null
  return (
    <HScroll title={title}>
      {malls.map(mall => {
        const place = mall.location_name ?? mall.city
        const meta = [formatDistanceKm(mall.distance), place].filter(Boolean).join(' • ')
        const image = mall.cover_image ?? mall.logo_url
        return (
          <Link
            key={mall.id}
            href={`/malls/${mall.slug ?? mall.id}`}
            className='block w-72 max-md:w-[60vw] shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0px_4.8px_20.4px_0px_rgba(0,0,0,0.08)] 2xl:w-96'
          >
            <span className='relative block aspect-16/10 bg-gray-100'>
              {image && <Image src={image} alt={mall.name} fill className='object-cover' sizes='(min-width: 1536px) 384px, 288px' />}
            </span>
            <span className='block p-3.5'>
              <span className='block truncate text-base font-bold text-[#2C2D32]'>{mall.name}</span>
              {meta && (
                <span className='mt-1 flex items-center gap-1 text-[13px] text-[#6B6B6B]'>
                  <MapPin className='size-3.5 shrink-0 text-brand' /> <span className='truncate'>{meta}</span>
                </span>
              )}
              {mallAmenityKeys(mall).length > 0 && (
                <span className='mt-2 flex flex-wrap gap-x-3 gap-y-1'>
                  {mallAmenityKeys(mall).slice(0, 3).map(key => {
                    const Icon = AMENITY_ICONS[key]
                    return (
                      <span key={key} className='flex items-center gap-1 text-xs text-[#424144]'>
                        <Icon className='size-3.5 text-brand' /> {MALL_AMENITY_LABELS[key]}
                      </span>
                    )
                  })}
                </span>
              )}
            </span>
          </Link>
        )
      })}
    </HScroll>
  )
}
