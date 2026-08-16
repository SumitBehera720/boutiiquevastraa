import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://boutiiquevastraa.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/account', '/cart', '/checkout'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
