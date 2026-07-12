import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Join Session',
  description: 'Enter a meeting room ID to join an active developer collaboration, live coding huddle, and AI-assisted pair programming session.',
  alternates: {
    canonical: 'https://meet.codovatesolutions.in/join',
  },
  openGraph: {
    title: 'Join Session | Codovate Meet',
    description: 'Enter a meeting room ID to join an active developer collaboration and live coding session.',
    url: 'https://meet.codovatesolutions.in/join',
  },
}

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
