'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
  theme: string
  setTheme: (theme: string) => void
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'light', setTheme: () => {} })

export function ThemeProvider({ children, defaultTheme = 'light' }: { children: React.ReactNode, defaultTheme?: string }) {
  const [theme, setThemeState] = useState('light')

  useEffect(() => {
    try {
      localStorage.setItem('theme-preference', 'light')
    } catch (e) {}
    document.documentElement.classList.add('light')
    document.documentElement.classList.remove('dark')
  }, [])

  const setTheme = (newTheme: string) => {
    setThemeState('light')
    try {
      localStorage.setItem('theme-preference', 'light')
    } catch (e) {}
    document.documentElement.classList.add('light')
    document.documentElement.classList.remove('dark')
  }

  useEffect(() => {
    setTheme('light')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ThemeContext.Provider value={{ theme: 'light', setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
