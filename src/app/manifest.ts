import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PassPrivé',
    short_name: 'PassPrivé',
    description: 'Exclusive deals on dining and stores near you.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ff4800',
    icons: [{ src: '/icon.png', sizes: '192x192', type: 'image/png' }],
  }
}
