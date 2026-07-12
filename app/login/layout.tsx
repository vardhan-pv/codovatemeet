import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In — Codovate Meet',
  description: 'Log in to your Codovate Meet account to collaborate, code, and debug with your team in real-time.',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
