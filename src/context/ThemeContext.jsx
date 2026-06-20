import { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react'
import { ACCENTS } from '../lib/constants'

const ThemeContext = createContext(null)
export const useTheme = () => useContext(ThemeContext)

const THEME_KEY = 'ge_theme'
const ACCENT_KEY = 'ge_accent'

const applyAccent = (accentKey) => {
  const accent = ACCENTS[accentKey] || ACCENTS.indigo
  const root = document.documentElement
  Object.entries(accent.shades).forEach(([shade, rgb]) => {
    root.style.setProperty(`--accent-${shade}`, rgb)
  })
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', accent.swatch)
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem(THEME_KEY) || 'light')
  const [accent, setAccentState] = useState(() => localStorage.getItem(ACCENT_KEY) || 'indigo')

  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    applyAccent(accent)
    localStorage.setItem(ACCENT_KEY, accent)
  }, [accent])

  const value = {
    theme,
    accent,
    isDark: theme === 'dark',
    setTheme: setThemeState,
    setAccent: setAccentState,
    toggleTheme: () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
