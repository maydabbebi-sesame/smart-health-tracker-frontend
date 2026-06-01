import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'

import { AppRouter } from './app/router'
import { useThemeStore } from './store/themeStore'

function App() {
  const theme = useThemeStore((state) => state.theme)
  const isDark = theme === 'dark'

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.style.colorScheme = theme
  }, [isDark, theme])

  return (
    <>
      <AppRouter />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3600,
          style: {
            background: isDark ? '#0f172a' : '#ffffff',
            border: `1px solid ${isDark ? '#164e63' : '#ccfbf1'}`,
            borderRadius: '14px',
            boxShadow: isDark ? '0 18px 45px rgba(0, 0, 0, 0.35)' : '0 18px 45px rgba(15, 23, 42, 0.12)',
            color: isDark ? '#e2e8f0' : '#0f172a',
          },
          success: {
            iconTheme: {
              primary: '#0d9488',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#e11d48',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </>
  )
}

export default App
