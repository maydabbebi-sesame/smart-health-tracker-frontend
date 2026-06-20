import { LayoutDashboard, ShieldPlus } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { useTranslation } from '../i18n/useTranslation'
import { LanguageSwitcher } from '../shared/ui/LanguageSwitcher'

export function AdminLayout() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-teal-500 text-slate-950">
              <ShieldPlus size={21} />
            </div>
            <div>
              <p className="text-sm font-semibold">{t('adminLayout.title', 'Administration Smart Health')}</p>
              <p className="text-xs text-slate-400">{t('adminLayout.subtitle', 'Opérations système')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <NavLink
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15"
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
