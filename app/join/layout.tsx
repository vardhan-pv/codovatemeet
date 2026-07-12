import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Join Session — Codovate Meet',
  description: 'Enter a meeting room ID to join an active developer collaboration and live coding huddle.',
}

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
