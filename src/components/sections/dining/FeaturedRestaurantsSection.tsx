import Link from 'next/link'
import { Star, MapPin, Tag } from 'lucide-react'

const RESTAURANTS = [
  {
    id: 1,
    name: 'Le Barachois',
    cuisine: 'Seafood · French · Creole',
    distance: '4.2km',
    area: 'Pointe aux Piments',
    rating: 4.7,
    reviewCount: 342,
    promo: '20% OFF on Dinner',
    bg: 'bg-gradient-to-br from-blue-300 to-cyan-500',
  },
  {
    id: 2,
    name: 'La Bonne Marmite',
    cuisine: 'Mauritian · Creole',
    distance: '2.1km',
    area: 'Flic en Flac',
    rating: 4.4,
    reviewCount: 189,
    promo: 'Flat 15% OFF',
    bg: 'bg-gradient-to-br from-amber-200 to-orange-400',
  },
  {
    id: 3,
    name: 'Cellar Door',
    cuisine: 'Contemporary · Wine Bar',
    distance: '6.8km',
    area: 'Grand Baie',
    rating: 4.6,
    reviewCount: 267,
    promo: 'Happy Hour 50% OFF',
    bg: 'bg-gradient-to-br from-purple-300 to-indigo-500',
  },
  {
    id: 4,
    name: 'The Beach Shack',
    cuisine: 'BBQ · Grill · Seafood',
    distance: '3.5km',
    area: 'Mont Choisy',
    rating: 4.3,
    reviewCount: 156,
    promo: '',
    bg: 'bg-gradient-to-br from-rose-200 to-pink-400',
  },
  {
    id: 5,
    name: 'Château Mon Désir',
    cuisine: 'Fine Dining · French',
    distance: '8.1km',
    area: 'Balaclava',
    rating: 4.8,
    reviewCount: 412,
    promo: 'Complimentary Welcome Drink',
    bg: 'bg-gradient-to-br from-stone-300 to-gray-500',
  },
  {
    id: 6,
    name: 'Namaste India',
    cuisine: 'Indian · Curry · Vegetarian',
    distance: '1.4km',
    area: 'Port Louis',
    rating: 4.2,
    reviewCount: 98,
    promo: '',
    bg: 'bg-gradient-to-br from-orange-200 to-yellow-400',
  },
]

export function FeaturedRestaurantsSection() {
  return (
    <section className="px-4 py-5 md:px-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-bold text-gray-900">Featured Restaurants</h2>
        <button type="button" className="text-[12px] font-semibold text-brand">
          See All
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {RESTAURANTS.map(restaurant => (
          <Link
            key={restaurant.id}
            href={`/dining/${restaurant.id}`}
            className="bg-white rounded-2xl overflow-hidden shadow-sm"
          >
            <div className={`relative w-full aspect-[4/3] ${restaurant.bg}`}>
              {restaurant.promo && (
                <div className="absolute bottom-0 inset-x-0 bg-black/55 px-2 py-1.5">
                  <div className="flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                    <p className="text-[9px] font-bold text-white leading-tight">{restaurant.promo}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-2.5">
              <p className="text-[12px] font-bold text-gray-900 truncate">{restaurant.name}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 truncate">{restaurant.cuisine}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-[10px] font-semibold text-gray-700">{restaurant.rating}</span>
                </div>
                <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />
                <div className="flex items-center gap-0.5 text-gray-400">
                  <MapPin className="w-2.5 h-2.5" />
                  <span className="text-[10px]">{restaurant.distance}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
