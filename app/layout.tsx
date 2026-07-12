import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://meet.codovatesolutions.in'),
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
    url: 'https://meet.codovatesolutions.in',
    siteName: 'Codovate Meet',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Codovate Meet Poster - AI-Powered Collaboration Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Codovate Meet — The Developer Communication & Collaboration Platform',
    description: 'Join a meeting, write code together, debug together, draw architecture, and use AI assistance.',
    images: ['/opengraph-image.png'],
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
        {/* JSON-LD Structured Data for Rich Google Search Results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "SoftwareApplication",
                  "name": "Codovate Meet",
                  "applicationCategory": "DeveloperApplication",
                  "operatingSystem": "Web",
                  "url": "https://meet.codovatesolutions.in",
                  "description": "AI-Powered Collaboration Platform for developers. Meet, Code, Build, and Deploy Together with real-time video meetings, collaborative code editing, AI pair programming, GitHub integration, and screen sharing.",
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                  },
                  "featureList": [
                    "Real-time Collaborative Code Editor",
                    "AI Pair Programmer",
                    "Video Meetings with WebRTC",
                    "AI Meeting Notes",
                    "Screen Sharing",
                    "GitHub Integration",
                    "Interactive Whiteboard",
                    "End-to-End Encrypted Meetings"
                  ],
                  "screenshot": "https://meet.codovatesolutions.in/opengraph-image.png",
                  "creator": {
                    "@type": "Organization",
                    "name": "Codovate Solutions",
                    "url": "https://codovatesolutions.com"
                  }
                },
                {
                  "@type": "Organization",
                  "name": "Codovate Solutions",
                  "url": "https://codovatesolutions.com",
                  "logo": "https://meet.codovatesolutions.in/logo.jpeg",
                  "sameAs": [
                    "https://github.com/codovatesolutions"
                  ]
                },
                {
                  "@type": "WebSite",
                  "name": "Codovate Meet",
                  "url": "https://meet.codovatesolutions.in",
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://meet.codovatesolutions.in/join?room={search_term_string}",
                    "query-input": "required name=search_term_string"
                  }
                }
              ]
            })
          }}
        />
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
