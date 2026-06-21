import { LayoutDashboard, ShieldPlus, Users } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { useTranslation } from '../i18n/useTranslation'
import { LanguageSwitcher } from '../shared/ui/LanguageSwitcher'
import { ThemeToggle } from '../shared/ui/ThemeToggle'

const navLinkBase = 'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition'
const navLinkActive = 'bg-[#eff5ef] text-[#00694c] dark:bg-white/15 dark:text-white'
const navLinkInactive = 'text-[#3d4943] hover:bg-[#eff5ef] dark:text-slate-300 dark:hover:bg-white/10'

export function AdminLayout() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-[#f5fbf5] text-[#171d1a] dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-[#dee4de] bg-white dark:border-white/10 dark:bg-slate-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#00694c] text-white dark:bg-teal-500 dark:text-slate-950">
              <ShieldPlus size={21} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#171d1a] dark:text-white">
                {t('adminLayout.title', 'Administration Smart Health')}
              </p>
              <p className="text-xs text-[#6d7a73] dark:text-slate-400">
                {t('adminLayout.subtitle', 'Opérations système')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-1">
              <NavLink
                className={({ isActive }) => `${navLinkBase} ${isActive ? navLinkActive : navLinkInactive}`}
                end
                to="/admin"
              >
                <LayoutDashboard size={17} />
                {t('adminLayout.dashboardLink', 'Tableau de bord')}
              </NavLink>
              <NavLink
                className={({ isActive }) => `${navLinkBase} ${isActive ? navLinkActive : navLinkInactive}`}
                to="/admin/users"
              >
                <Users size={17} />
                {t('adminLayout.usersLink', 'Utilisateurs')}
              </NavLink>
            </nav>
            <LanguageSwitcher />
            <ThemeToggle />
            <NavLink
              className={`${navLinkBase} bg-[#eff5ef] text-[#00694c] hover:bg-[#dff0e7] dark:bg-white/10 dark:text-white dark:hover:bg-white/15`}
              to="/dashboard"
            >
              <LayoutDashboard size={17} />
              {t('adminLayout.userAppLink', 'Application utilisateur')}
            </NavLink>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
