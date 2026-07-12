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
  keywords: [
    'AI Collaboration Platform',
    'Developer Collaboration',
    'AI Video Conferencing',
    'Collaborative Coding',
    'Remote Pair Programming',
    'AI Pair Programmer',
    'Live Coding Meetings',
    'Online Code Editor',
    'WebRTC Meetings',
    'LiveKit Video Calls',
    'AI Meeting Notes',
    'AI Coding Assistant',
    'VS Code Collaboration',
    'Software Development Platform',
    'Engineering Team Collaboration',
    'Secure Video Meetings',
    'Startup Collaboration',
    'Remote Development',
    'Real-time Collaboration',
    'Codovate Meet'
  ],
  authors: [{ name: 'Codovate Solutions', url: 'https://codovatesolutions.com' }],
  creator: 'Codovate Solutions',
  publisher: 'Codovate Solutions',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/logo.jpeg',
    shortcut: '/logo.jpeg',
    apple: '/logo.jpeg',
  },
  openGraph: {
    title: 'Codovate Meet — The Developer Communication & Collaboration Platform',
    description:
      'Join a meeting, write code together, debug together, draw architecture, and use AI assistance — all in one collaborative space.',
    url: 'https://meet.codovate.com',
    siteName: 'Codovate Meet',
    images: [
      {
        url: '/logo.jpeg',
        width: 1200,
        height: 630,
        alt: 'Codovate Meet Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Codovate Meet — The Developer Communication & Collaboration Platform',
    description: 'Join a meeting, write code together, debug together, draw architecture, and use AI assistance.',
    images: ['/logo.jpeg'],
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
