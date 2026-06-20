import { adminStats } from '../../mocks/admin.mock'
import { useTranslation } from '../../i18n/useTranslation'

function AdminDashboardPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('admin.dashboard.title', 'Tableau de bord administrateur')}</h1>
        <p className="mt-1 text-sm text-slate-400">
          {t('admin.dashboard.subtitle', "Zone isolée optionnelle pour la supervision de la plateforme et le support utilisateur.")}
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {adminStats.map((stat) => (
          <article key={stat.label} className="rounded-lg border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">{t(stat.labelKey, stat.label)}</p>
            <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
          </article>
        ))}
      </section>
    </div>
  )
}

export default AdminDashboardPage
