import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/register', '/join'],
      disallow: ['/dashboard', '/room', '/settings', '/api/'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'https://meet.codovate.com'}/sitemap.xml`,
  }
}
