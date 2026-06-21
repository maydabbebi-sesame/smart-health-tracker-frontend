import { adminStats } from '../../mocks/admin.mock'
import { useTranslation } from '../../i18n/useTranslation'

function AdminDashboardPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#171d1a] dark:text-white">
          {t('admin.dashboard.title', 'Tableau de bord administrateur')}
        </h1>
        <p className="mt-1 text-sm text-[#6d7a73] dark:text-slate-400">
          {t('admin.dashboard.subtitle', "Zone isolée optionnelle pour la supervision de la plateforme et le support utilisateur.")}
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {adminStats.map((stat) => (
          <article
            className="rounded-lg border border-[#dee4de] bg-white p-5 dark:border-white/10 dark:bg-white/5"
            key={stat.label}
          >
            <p className="text-sm text-[#6d7a73] dark:text-slate-400">{t(stat.labelKey, stat.label)}</p>
            <p className="mt-2 text-3xl font-semibold text-[#171d1a] dark:text-white">{stat.value}</p>
          </article>
        ))}
      </section>
    </div>
  )
}

export default AdminDashboardPage
