import { Accessibility, Baby, Banknote, Bath, Car, Clapperboard, HandHeart, KeyRound, PlugZap, Puzzle, Utensils, Wifi, type LucideIcon } from 'lucide-react'

export const AMENITY_ICONS: Record<string, LucideIcon> = {
  parking: Car,
  wheelchair: Accessibility,
  ev_charging: PlugZap,
  wifi: Wifi,
  restrooms: Bath,
  baby_care: Baby,
  prayer_room: HandHeart,
  atm: Banknote,
  food_court: Utensils,
  kids_play: Puzzle,
  cinema: Clapperboard,
  valet: KeyRound,
}
