import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Join Live Room | Codovate Meet',
  description: 'Connect, communicate, and build together in real-time. Join the live developer workspace and collaborative pair programming huddle.',
  openGraph: {
    title: 'Join Live Room | Codovate Meet',
    description: 'Connect, communicate, and build together in real-time. Join the live developer workspace and collaborative pair programming huddle.',
    type: 'website',
    images: [
      {
        url: '/logo.jpeg',
        width: 1200,
        height: 630,
        alt: 'Codovate Meet Logo',
      }
    ]
  }
}

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
