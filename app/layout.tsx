import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import { Providers } from './providers'
import SplashScreen from '@/components/layout/splash-screen'
import CookieBanner from '@/components/layout/cookie-banner'

import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://meet.codovatesolutions.in'),
  applicationName: 'Codovate Meet',

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
    'Online Meeting',
    'Video Meeting',
    'Video Conferencing',
    'Virtual Meeting',
    'AI Meeting',
    'AI Video Meeting',
    'Web Conferencing',
    'Online Conference',
    'Business Meetings',
    'Team Meetings',
    'Online Collaboration',
    'Meeting Platform',
    'Meeting Software',
    'Video Call',
    'Secure Video Meeting',
    'HD Video Conferencing',
    'Cloud Meetings',
    'Remote Meetings',
    'Online Webinar',
    'Best online meeting platform',
    'Best video conferencing software',
    'Free online meeting app',
    'AI meeting assistant',
    'Secure online meeting platform',
    'HD video conferencing',
    'Online meeting platform for business',
    'Virtual meeting software for companies',
    'Online meeting software with AI',
    'Video meeting with live transcription',
    'AI meeting summaries',
    'Real-time meeting translation',
    'Screen sharing meeting app',
    'Browser-based video meeting',
    'Encrypted video conferencing',
    'Remote team collaboration software',
    'Online meeting software India',
    'Video conferencing platform India',
    'Indian video meeting app',
    'Secure meeting platform India',
    'Online Meeting Software',
    'AI Meeting Assistant',
    'Meeting Productivity',
    'Remote Team Collaboration',
    'Webinar Platform',
    'Enterprise Communication',
    'Secure Video Meetings',
    'Online Education Meetings',
    'Customer Video Support',
    'Best Online Meeting Platform | HD Video Meetings',
    'Secure Online Meetings with AI | Free Video Calls',
    'Online Video Conferencing for Teams & Businesses',
    'Host HD Online Meetings Anytime, Anywhere',
    'AI-Powered Online Meeting Platform | Start Free',
    'AI Meeting Assistant | Notes, Transcripts & Summaries',
    'Smart Video Meetings with AI Transcription',
    'AI Video Conferencing with Live Captions & Notes',
    'AI Meeting Platform for Productive Teams',
    'Automate Meetings with AI Notes & Action Items',
    'Enterprise Video Conferencing | Secure Online Meetings',
    'Business Meeting Software | HD Video Conferencing',
    'Professional Online Meeting Platform for Teams',
    'Corporate Video Meetings with End-to-End Encryption',
    'Hybrid Meeting Software for Modern Businesses',
    'AI Video Meetings + Free Recording + Live Captions',
    'Secure Online Meetings + HD Video + Screen Sharing',
    'Online Meeting Software + AI Notes + Start Free',
    'Video Conferencing + No Downloads + Browser-Based',
    'Enterprise Meetings + AI Transcription + End-to-End Encryption',
    'AI Online Meeting Platform | HD Video Conferencing, AI Notes & Screen Sharing',
    'Online Meeting Platform for Schools',
    'Virtual Classroom Software',
    'Online Learning Video Platform',
    'Video Conferencing for Universities',
    'AI Meeting Assistant for Teachers',
    'Student Group Meeting Platform',
    'Parent-Teacher Online Meeting Software',
    'Online Exam Interview Platform',
    'Webinar Platform for Education',
    'Remote Learning Collaboration Software',
    'Sales Demo Video Meeting Platform',
    'Online Sales Presentation Software',
    'Virtual Sales Meeting Platform',
    'Client Pitch Video Conferencing',
    'AI Meeting Notes for Sales Teams',
    'Online Product Demo Platform',
    'Customer Discovery Meeting Software',
    'Remote Sales Collaboration Platform',
    'Sales Training Video Meeting Software',
    'Video Conferencing for B2B Sales',
    'Agile Sprint Meeting Software',
    'Daily Standup Meeting Platform',
    'Developer Collaboration Tool',
    'Engineering Team Video Meetings',
    'Product Team Meeting Software',
    'Client Review Meetings',
    'Campaign Planning Meetings',
    'Creative Team Collaboration',
    'Marketing Webinar Platform',
    'Agency Video Conferencing'
  ],

  authors: [{ name: 'Codovate Solutions', url: 'https://codovatesolutions.com' }],
  creator: 'Codovate Solutions',
  publisher: 'Codovate Solutions',

  alternates: {
    canonical: 'https://meet.codovatesolutions.in',
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
        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-5TV459B9');
          `}
        </Script>
      </head>
      <body className="font-sans antialiased bg-[#030712] text-slate-200" suppressHydrationWarning>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-5TV459B9"
            height="0" 
            width="0" 
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
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
          src="https://www.googletagmanager.com/gtag/js?id=G-BMK8WZ22WV"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            
            // Default consent to 'denied'
            gtag('consent', 'default', {
              'analytics_storage': 'denied',
              'personalization_storage': 'denied',
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
              'wait_for_update': 500
            });

            gtag('js', new Date());
            gtag('config', 'G-BMK8WZ22WV');
          `}
        </Script>
        <Providers>
          <SplashScreen />
          <CookieBanner />
          {children}
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
