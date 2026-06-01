import { motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'

import { useThemeStore } from '../../store/themeStore'

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  const isDark = theme === 'dark'

  return (
    <motion.button
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-cyan-100 dark:hover:bg-slate-800"
      type="button"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
      onClick={toggleTheme}
    >
      <motion.span
        animate={{ opacity: isDark ? 0 : 1, rotate: isDark ? -90 : 0, scale: isDark ? 0.7 : 1 }}
        className="absolute"
        transition={{ duration: 0.18 }}
      >
        <Sun size={18} />
      </motion.span>
      <motion.span
        animate={{ opacity: isDark ? 1 : 0, rotate: isDark ? 0 : 90, scale: isDark ? 1 : 0.7 }}
        className="absolute"
        transition={{ duration: 0.18 }}
      >
        <Moon size={18} />
      </motion.span>
    </motion.button>
  )
}
