'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultTheme="dark">
      {children}
    </ThemeProvider>
  )
}
