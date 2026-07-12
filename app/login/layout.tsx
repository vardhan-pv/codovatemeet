import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Log in to your Codovate Meet account to collaborate, code, and debug with your team in real-time. Secure authentication with end-to-end encryption.',
  alternates: {
    canonical: 'https://meet.codovatesolutions.in/login',
  },
  openGraph: {
    title: 'Sign In | Codovate Meet',
    description: 'Log in to your Codovate Meet account to collaborate, code, and debug with your team in real-time.',
    url: 'https://meet.codovatesolutions.in/login',
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
