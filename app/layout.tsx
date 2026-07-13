import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import { Providers } from './providers'

import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://meet.codovatesolutions.in'),

  title: {
    default: 'Codovate Meet — AI-Powered Collaboration Platform',
    template: '%s | Codovate Meet',
  },

  description:
    'AI-powered collaboration platform for developers, teams and startups. Video meetings, AI Pair Programmer, Live Workspace, screen sharing, GitHub integration and real-time coding — all in one place. Meet. Code. Build. Deploy Together.',

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
    'Codovate Meet',
    'Google Meet alternative',
    'Zoom alternative for developers',
    'developer meeting platform',
    'live code collaboration',
    'screen sharing for developers',
    'GitHub integration meetings',
  ],

  authors: [{ name: 'Codovate Solutions', url: 'https://codovatesolutions.com' }],
  creator: 'Codovate Solutions',
  publisher: 'Codovate Solutions',

  alternates: {
    canonical: 'https://meet.codovatesolutions.in',
  },

  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: '/apple-icon.png',
  },

  manifest: '/site.webmanifest',

  openGraph: {
    title: 'Codovate Meet — AI-Powered Developer Collaboration Platform',
    description:
      'Meet, code and build together with AI. Codovate Meet combines video conferencing, collaborative coding, AI Pair Programmer and Live Workspace into one platform.',
    url: 'https://meet.codovatesolutions.in',
    siteName: 'Codovate Meet',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Codovate Meet — AI-Powered Collaboration Platform for Developers',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Codovate Meet — AI-Powered Developer Collaboration Platform',
    description: 'Meet, code and build together with AI. Video meetings, collaborative coding, AI Pair Programmer and GitHub integration.',
    images: ['/opengraph-image.png'],
    creator: '@codovate',
    site: '@codovate',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  verification: {
    // Add your verification codes when available:
    // google: 'your-google-site-verification-code',
    // yandex: 'your-yandex-verification-code',
  },

  category: 'technology',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'dark',
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
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
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
                  "applicationCategory": "BusinessApplication",
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
                },
                {
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "What is Codovate Meet?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Codovate Meet is an AI-powered collaboration platform for developers and teams. It combines video meetings, a real-time collaborative code editor, AI Pair Programmer, interactive whiteboard, screen sharing, and GitHub integration into one seamless workspace."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "How does the AI Pair Programmer work?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "The AI Pair Programmer listens to your meeting context and provides intelligent code suggestions, auto-completions, bug fixes, and explanations. It works alongside you in the collaborative code editor during live meetings."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Is Codovate Meet free to use?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes, Codovate Meet offers a free tier with full access to video meetings, collaborative coding, AI assistance, screen sharing, and GitHub integration. No credit card required."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Why choose Codovate Meet over Google Meet or Zoom?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Unlike Google Meet or Zoom, Codovate Meet is purpose-built for developers. It includes a built-in VS Code-style code editor, AI Pair Programmer, GitHub push integration, an interactive whiteboard, and real-time code collaboration — features that generic meeting platforms don't offer."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Is Codovate Meet secure?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes, all meetings use end-to-end encryption via WebRTC. Your code is never stored on our servers and all communication is peer-to-peer encrypted."
                      }
                    }
                  ]
                }
              ]
            })
          }}
        />
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-97HFFMFND4"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-97HFFMFND4');
          `}
        </Script>
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
