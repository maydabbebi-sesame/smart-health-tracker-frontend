import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Search, ShieldPlus, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { clearToken } from '../features/auth/auth'
import { navigationItems } from '../shared/navigation'
import { ThemeToggle } from '../shared/ui/ThemeToggle'

const linkBase =
  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-teal-50 hover:text-teal-800 dark:hover:bg-teal-500/10 dark:hover:text-cyan-100'

function SidebarContent({ onNavigate }) {
  return (
    <>
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-teal-600 text-white">
          <ShieldPlus size={21} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">Smart Health</p>
          <p className="text-xs text-slate-500">Personal health hub</p>
        </div>
      </div>

      <nav className="space-y-1 px-3 py-4">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `${linkBase} ${
                isActive
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-900/10 hover:bg-teal-600 hover:text-white'
                  : 'text-slate-600'
              }`
            }
          >
            <motion.span className="flex items-center gap-3" whileHover={{ x: 2 }} transition={{ duration: 0.18 }}>
              <item.icon size={19} />
              {item.label}
            </motion.span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  function handleLogout() {
    clearToken()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:block">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-40 lg:hidden"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
          >
            <button
              aria-label="Close navigation"
              className="absolute inset-0 bg-slate-950/40"
              type="button"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.aside
              animate={{ x: 0 }}
              className="relative h-full w-72 border-r border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950"
              exit={{ x: -288 }}
              initial={{ x: -288 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
            >
              <button
                aria-label="Close navigation"
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                type="button"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X size={20} />
              </button>
              <SidebarContent onNavigate={() => setIsSidebarOpen(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <motion.button
                aria-label="Open navigation"
                className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-700 lg:hidden"
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu size={20} />
              </motion.button>
              <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 md:flex">
                <Search size={17} />
                Search symptoms, history, insights
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-900">Maya Ben Ali</p>
                <p className="text-xs text-slate-500">Patient account</p>
              </div>
              <motion.button
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
              >
                Logout
              </motion.button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              initial={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
