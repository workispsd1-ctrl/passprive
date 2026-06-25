import { Navigation } from 'lucide-react'

interface Props {
  name: string
  fullAddress: string | null | undefined
  area: string | null | undefined
  city: string | null | undefined
  latitude: number | null | undefined
  longitude: number | null | undefined
  phone: string | null | undefined
}

export function RestaurantLocationSection({ name, fullAddress, area, city, latitude, longitude, phone }: Props) {
  if (!fullAddress && !area) return null

  const address = fullAddress ?? `${area}, ${city}`
  const directionsHref = latitude && longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`

  return (
    <section className='mt-8 border-t border-gray-200 pt-6 pb-8'>
      <h2 className='text-[18px] font-bold text-gray-900 mb-4'>Location</h2>
      <div className='border rounded-2xl'>
        <div className='w-full h-52 rounded-t-2xl overflow-hidden mb-4 bg-gray-100'>
          {latitude && longitude ? (
            <iframe
              title='Restaurant location'
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.006},${latitude - 0.004},${longitude + 0.006},${latitude + 0.004}&layer=mapnik&marker=${latitude},${longitude}`}
              className='w-full h-full border-0'
            />
          ) : (
            <div className='w-full h-full bg-gray-200 flex items-center justify-center'>
              <p className='text-[13px] text-gray-400'>Map not available</p>
            </div>
          )}
        </div>
        <div className='px-4 pb-4'>
          <p className='font-bold text-gray-900'>{name}</p>
          <p className='text-sm text-gray-500 mt-0.5 leading-relaxed'>{address}</p>
          <a
            href={directionsHref}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-1 mt-2.5 text-[12px] font-semibold text-brand hover:underline'
          >
            <Navigation className='w-3.5 h-3.5' /> Get Directions
          </a>
          {phone && <p className='text-[12px] text-gray-600 mt-2'>☎ {phone}</p>}
        </div>
      </div>
    </section>
  )
}
