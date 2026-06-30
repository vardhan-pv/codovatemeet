'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
  theme: string
  setTheme: (theme: string) => void
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'dark', setTheme: () => {} })

export function ThemeProvider({ children, defaultTheme = 'dark' }: { children: React.ReactNode, defaultTheme?: string }) {
  const [theme, setThemeState] = useState(defaultTheme)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme-preference')
      if (stored === 'light' || stored === 'dark') {
        setThemeState(stored)
      }
    } catch (e) {}
  }, [])

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem('theme-preference', newTheme)
    } catch (e) {}
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
  }

  // Effect to apply theme on mount to ensure classes sync with state
  useEffect(() => {
    setTheme(theme)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
