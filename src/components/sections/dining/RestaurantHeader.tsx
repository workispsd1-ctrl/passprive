import {
  MapPin, Star, BadgeCheck, CreditCard,
  Award, Lock, Navigation, Share2, Phone, Info,
} from 'lucide-react'
import { HoursPopover } from './HoursPopover'
import type { Restaurant, RestaurantHours, ReviewSummary } from '@/lib/types/dining'
import type { UserCashbackInfo } from '@/lib/types/wallet'

function getOpenStatus(hours: RestaurantHours | null) {
  if (!hours) return null
  if (hours.is_closed || !hours.open_time || !hours.close_time)
    return { isOpen: false, statusText: 'Closed today' }
  const now = new Date()
  const [oh, om] = hours.open_time.split(':').map(Number)
  const [ch, cm] = hours.close_time.split(':').map(Number)
  const nowMins = now.getHours() * 60 + now.getMinutes()
  const openMins = oh * 60 + om
  const closeMins = ch * 60 + cm
  const isOpen = closeMins > openMins
    ? nowMins >= openMins && nowMins < closeMins
    : nowMins >= openMins || nowMins < closeMins
  const fmt = (h: number, m: number) =>
    `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
  return {
    isOpen,
    statusText: isOpen ? `Open until ${fmt(ch, cm)}` : `Opens at ${fmt(oh, om)}`,
  }
}

interface Props {
  restaurant: Restaurant
  cashbackInfo: UserCashbackInfo | null
  todayHours: RestaurantHours | null
  allHours: RestaurantHours[]
  reviewSummary: ReviewSummary
}

export function RestaurantHeader({ restaurant, cashbackInfo, todayHours, allHours, reviewSummary }: Props) {
  const openStatus = getOpenStatus(todayHours)

  return (
    <div className='mt-4 md:mt-0'>
      {/* Name + merchant badges */}
      <div className='flex items-start gap-2 flex-wrap'>
        <h1 className='text-[28px] md:text-[36px] font-bold text-gray-900 leading-tight'>
          {restaurant.name}
        </h1>
        {restaurant.is_pure_veg && (
          <span className='shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 border border-green-200 text-[11px] font-semibold text-green-700 mt-1.5'>
            <BadgeCheck className='w-3 h-3' /> Pure Veg
          </span>
        )}
        {restaurant.merchant_type === 'preferred' && (
          <span className='shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-50 border border-violet-200 text-[11px] font-semibold text-violet-700 mt-1.5'>
            <Award className='w-3 h-3' /> Preferred Partner
          </span>
        )}
        {restaurant.merchant_type === 'verified' && (
          <span className='shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700 mt-1.5'>
            <CreditCard className='w-3 h-3' /> Verified Pay
          </span>
        )}
        {!restaurant.merchant_type && (
          <span className='shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-[11px] font-semibold text-gray-500 mt-1.5'>
            <Lock className='w-3 h-3' /> Unclaimed
          </span>
        )}
      </div>

      {/* Rating + price + hours */}
      <div className='flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-[14px]'>
        {reviewSummary.avg > 0 && (
          <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-700 text-white text-[13px] font-bold'>
            {reviewSummary.avg}
            <Star className='w-3 h-3 fill-white' />
          </span>
        )}
        {restaurant.cost_for_two != null && (
          <>
            <span className='text-gray-300 font-light'>|</span>
            <span className='text-gray-800 font-medium'>
              ₨{restaurant.cost_for_two.toLocaleString()} for two
            </span>
          </>
        )}
        {openStatus && (
          <>
            <span className='text-gray-300 font-light'>|</span>
            <span className={openStatus.isOpen ? 'text-green-600 font-semibold' : 'text-orange-500 font-semibold'}>
              {openStatus.isOpen ? 'Open' : 'Closed'}
            </span>
            <span className='text-gray-400'>•</span>
            <HoursPopover
              todayHours={todayHours}
              allHours={allHours}
              statusText={openStatus.statusText}
              isOpen={openStatus.isOpen}
            />
          </>
        )}
      </div>

      {/* Address */}
      {(restaurant.full_address ?? restaurant.area) && (
        <div className='flex items-start gap-1.5 mt-3'>
          <MapPin className='w-4 h-4 text-gray-400 mt-0.5 shrink-0' />
          <span className='text-[13px] text-gray-500 leading-snug'>
            {restaurant.full_address ?? `${restaurant.area}, ${restaurant.city}`}
          </span>
        </div>
      )}

      {/* Cashback badge */}
      {restaurant.merchant_type ? (
        cashbackInfo ? (
          <div className='mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-violet-50 border border-violet-100'>
            <span className='text-violet-600 font-black text-[15px]'>{cashbackInfo.cashback_rate}%</span>
            <span className='text-[13px] font-semibold text-violet-700'>PP Coins cashback on your bill</span>
          </div>
        ) : (
          <div className='mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-violet-50 border border-violet-100'>
            <span className='text-[13px] font-semibold text-violet-700'>Earn PP Coins cashback here</span>
          </div>
        )
      ) : (
        <div className='mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gray-50 border border-gray-200'>
          <Info className='w-3.5 h-3.5 text-gray-400 shrink-0' />
          <span className='text-[13px] text-gray-500'>PassPrivé payments not available here yet</span>
        </div>
      )}

      {/* Action buttons */}
      <div className='flex flex-wrap gap-3 mt-5'>
        <button
          type='button'
          className='flex items-center gap-2 px-7 py-3 rounded-2xl border border-gray-200 text-[14px] font-semibold text-gray-800 hover:bg-gray-50 transition-colors'
        >
          <Navigation className='w-4 h-4' /> Direction
        </button>
        <button
          type='button'
          className='flex items-center gap-2 px-7 py-3 rounded-2xl border border-gray-200 text-[14px] font-semibold text-gray-800 hover:bg-gray-50 transition-colors'
        >
          <Share2 className='w-4 h-4' /> Share
        </button>
        {restaurant.phone && (
          <a
            href={`tel:${restaurant.phone}`}
            className='flex items-center gap-2 px-7 py-3 rounded-2xl border border-gray-200 text-[14px] font-semibold text-gray-800 hover:bg-gray-50 transition-colors'
          >
            <Phone className='w-4 h-4' /> Call
          </a>
        )}
      </div>
    </div>
  )
}
