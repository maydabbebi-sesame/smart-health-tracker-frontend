import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Menu, Search, Settings, ShieldPlus, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { clearToken } from '../features/auth/auth'
import { navigationItems } from '../shared/navigation'
import { ThemeToggle } from '../shared/ui/ThemeToggle'

const linkBase =
  'relative flex items-center gap-3 rounded-r-lg border-l-4 px-4 py-3 text-sm font-medium transition-all hover:translate-x-1 hover:bg-[#eff5ef] hover:text-[#00694c] dark:hover:bg-teal-500/10 dark:hover:text-cyan-100'

function SidebarContent({ onNavigate }) {
  return (
    <>
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#00694c] text-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <ShieldPlus size={21} />
        </div>
        <div>
          <p className="text-sm font-bold text-[#171d1a] dark:text-white">SmartHealth</p>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#00694c] dark:text-teal-300">
            Precision Care
          </p>
        </div>
      </div>

      <div className="px-6 py-6">
        <h2 className="text-lg font-black text-slate-950 dark:text-white">Health Hub</h2>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#6d7a73]">Personal wellness</p>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `${linkBase} ${
                isActive
                  ? 'border-[#00694c] bg-[#eff5ef] text-[#00694c] font-semibold dark:border-teal-300 dark:bg-teal-900/20 dark:text-teal-200'
                  : 'border-transparent text-slate-600 dark:text-slate-400'
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

      <div className="mt-auto p-5">
        <div className="rounded-xl bg-[#008560] p-4 text-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p className="text-xs font-bold uppercase tracking-wider">Pro Plan</p>
          <p className="mt-2 text-sm leading-6">Accedez a des analyses sante avancees.</p>
          <button
            className="mt-4 w-full rounded-lg bg-white px-4 py-2 text-sm font-bold text-[#00694c]"
            type="button"
          >
            Ameliorer
          </button>
        </div>
      </div>
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
    <div className="min-h-screen bg-[#f5fbf5] text-[#171d1a] dark:bg-slate-950 dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-[#dee4de] bg-slate-50 pt-16 dark:border-slate-800 dark:bg-slate-950 lg:flex">
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
              className="relative flex h-full w-72 flex-col border-r border-[#dee4de] bg-slate-50 pt-2 shadow-xl dark:border-slate-800 dark:bg-slate-950"
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
        <header className="sticky top-0 z-30 border-b border-[#dee4de] bg-white/95 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
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
              <div className="hidden w-[min(42vw,520px)] items-center gap-2 rounded-lg border border-transparent bg-[#eff5ef] px-4 py-2 text-sm text-[#6d7a73] md:flex">
                <Search size={17} />
                Rechercher des donnees...
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                aria-label="Ouvrir les notifications"
                className="relative grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-[#eff5ef] hover:text-[#00694c] focus:outline-none focus:ring-2 focus:ring-[#00694c]/30"
                type="button"
                onClick={() => navigate('/notifications')}
              >
                <Bell size={20} />
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#ba1a1a]" />
              </button>
              <button
                aria-label="Ouvrir les parametres"
                className="grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-[#eff5ef] hover:text-[#00694c] focus:outline-none focus:ring-2 focus:ring-[#00694c]/30"
                type="button"
                onClick={() => navigate('/settings')}
              >
                <Settings size={20} />
              </button>
              <button
                className="hidden rounded-lg px-2 py-1 text-right transition hover:bg-[#eff5ef] focus:outline-none focus:ring-2 focus:ring-[#00694c]/30 sm:block"
                type="button"
                onClick={() => navigate('/profile')}
              >
                <p className="text-sm font-semibold text-slate-900">Maya Ben Ali</p>
                <p className="text-xs text-slate-500">Patient account</p>
              </button>
              <motion.button
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00694c]/30"
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

        <main className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8 lg:pl-8">
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
