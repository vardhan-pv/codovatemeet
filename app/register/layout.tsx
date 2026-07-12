import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create an Account — Codovate Meet',
  description: 'Sign up for Codovate Meet and start hosting secure, AI-assisted video meetings and real-time pair programming sessions.',
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
