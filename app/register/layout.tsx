import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Sign up for Codovate Meet and start hosting secure, AI-assisted video meetings and real-time pair programming sessions. Free to get started.',
  alternates: {
    canonical: 'https://meet.codovatesolutions.in/register',
  },
  openGraph: {
    title: 'Create Account | Codovate Meet',
    description: 'Sign up for Codovate Meet and start hosting secure, AI-assisted video meetings and real-time pair programming sessions.',
    url: 'https://meet.codovatesolutions.in/register',
  },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
