import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BlueWhale — ຕະຫຼາດດິຈິຕອລລາວ',
    short_name: 'BlueWhale',
    description: 'ຊື້ສິນຄ້າ ລາຄາດີ ສົ່ງໄວ ທົ່ວລາວ',
    start_url: '/',
    display: 'standalone',
    background_color: '#1247D8',
    theme_color: '#1247D8',
    orientation: 'portrait',
    categories: ['shopping', 'lifestyle'],
    lang: 'lo',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    screenshots: [
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
