import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Boutiique Vastraa',
    short_name: 'Vastraa',
    description: 'Premium Women\'s Ethnic Wear',
    start_url: '/',
    display: 'standalone',
    background_color: '#FDFBF7',
    theme_color: '#800020',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
