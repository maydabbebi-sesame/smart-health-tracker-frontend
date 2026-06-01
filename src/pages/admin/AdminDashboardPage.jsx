import { adminStats } from '../../mocks/admin.mock'

function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Optional isolated area for platform monitoring and user support.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {adminStats.map((stat) => (
          <article key={stat.label} className="rounded-lg border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
          </article>
        ))}
      </section>
    </div>
  )
}

export default AdminDashboardPage
