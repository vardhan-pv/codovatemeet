import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://meet.codovate.com'),
  title: 'Codovate Meet — The AI-Powered Developer Collaboration Platform',
  description:
    'Join a meeting, write code together, debug together, draw architecture, and use AI assistance — all in one collaborative space.',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'Codovate Meet — The Developer Communication & Collaboration Platform',
    description:
      'Join a meeting, write code together, debug together, draw architecture, and use AI assistance — all in one collaborative space.',
    url: 'https://meet.codovate.com',
    siteName: 'Codovate Meet',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Codovate Meet Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#3b82f6' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} bg-background dark`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased bg-[#030712] text-slate-200" suppressHydrationWarning>
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
