'use client'

import { useTheme } from '../contexts/ThemeContext'

export default function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button 
      className="theme-switch" 
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <i class="fa-regular fa-moon"></i> : <i class="fa-regular fa-sun"></i>}
    </button>
  )
}
