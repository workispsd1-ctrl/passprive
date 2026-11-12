import { notFound } from 'next/navigation'

/**
 * App parity: Tourist is a disabled "COMING SOON" tile in the app
 * (CategoryGrid.jsx), so every /tourist page is hidden until it goes live there.
 * Delete this layout to bring the section back.
 */
export default function TouristLayout(): never {
  notFound()
}
