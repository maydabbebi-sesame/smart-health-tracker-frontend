import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  AlertTriangle,
  Bell,
  BrainCircuit,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  HeartPulse,
  Thermometer,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { LoadingSkeleton } from '../shared/ui/LoadingSkeleton'
import { getDashboardCharts, getDashboardSummary } from '../services/dashboardService'
import { getProfile } from '../services/userService'
import { getRecommendations } from '../services/aiService'
import { getCurrentUser } from '../features/auth/auth'

const statIcons = {
  activity: Activity,
  bell: Bell,
  heart: HeartPulse,
  temperature: Thermometer,
}

function ChartTooltip({ active, label, payload }) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg shadow-slate-900/10">
      <p className="font-semibold text-slate-950">{label}</p>
      <div className="mt-1 space-y-1">
        {payload.map((item) => (
          <p className="text-slate-600" key={item.dataKey}>
            <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.name}: <span className="font-semibold text-slate-900">{item.value}</span>
          </p>
        ))}
      </div>
    </div>
  )
}

function ChartCard({ children, subtitle, title }) {
  return (
    <article className="sht-card p-5">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="h-72">{children}</div>
    </article>
  )
}

function DashboardPage() {
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
  })
  const { data: charts, isLoading: isChartsLoading } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: getDashboardCharts,
  })
  const { data: profileData } = useQuery({ queryKey: ['profile'], queryFn: getProfile })
  const { data: recommendationsData } = useQuery({ queryKey: ['ai-recommendations'], queryFn: getRecommendations })

  if (isSummaryLoading || isChartsLoading) {
    return <LoadingSkeleton />
  }

  if (!summary || !charts) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-lg text-slate-600">Failed to load dashboard data. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 md:grid-cols-12">
        <div className="flex flex-col justify-center md:col-span-8">
          <h1 className="text-[32px] font-semibold leading-tight text-[#171d1a] dark:text-white">
            Bonjour {profileData?.data?.first_name || profileData?.data?.name || getCurrentUser()?.email || 'Utilisateur'}
          </h1>
          <p className="mt-3 flex items-center gap-2 text-base text-[#6d7a73]">
            <CalendarDays size={19} />
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <article className="sht-card flex items-center justify-between p-5 md:col-span-4">
          <div>
            <h2 className="text-xl font-semibold text-[#171d1a] dark:text-white">Score Sante</h2>
            {(() => {
              const wellnessStat = summary?.stats?.find((s) => s.label.toLowerCase().includes('wellness'))
              const raw = wellnessStat?.value ?? null
              const num = raw !== null ? parseInt(String(raw).replace('%', ''), 10) : null
              let subtitle = 'Aucune donnée disponible maintenant'
              if (num !== null) {
                if (num >= 80) subtitle = 'Excellente progression'
                else if (num >= 60) subtitle = 'Bonne progression'
                else if (num >= 40) subtitle = 'Progression moyenne'
                else subtitle = 'Progression faible'
              }

              return <p className="mt-1 text-sm text-[#6d7a73]">{subtitle}</p>
            })()}
          </div>
          <div className="relative grid h-20 w-20 place-items-center">
            <svg className="h-full w-full -rotate-90">
              <circle cx="40" cy="40" fill="transparent" r="34" stroke="#dee4de" strokeWidth="8" />
              <circle
                cx="40"
                cy="40"
                fill="transparent"
                r="34"
                stroke="#00694c"
                strokeDasharray="213.6"
                strokeDashoffset="47"
                strokeLinecap="round"
                strokeWidth="8"
              />
            </svg>
            <span className="font-metric absolute text-lg font-semibold text-[#00694c]">{(() => {
              const wellnessStat = summary?.stats?.find((s) => s.label.toLowerCase().includes('wellness'))
              const raw = wellnessStat?.value ?? null
              return raw !== null ? String(raw).replace('%', '') : '--'
            })()}</span>
          </div>
        </article>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.stats && summary.stats.map((stat) => {
          const StatIcon = statIcons[stat.icon]
          const hasValue = stat.value !== null && stat.value !== undefined

          return (
            <article key={stat.label} className="sht-card p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#eff5ef] text-[#00694c]">
                  <StatIcon size={23} />
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${hasValue ? 'bg-[#86f8c9]/35 text-[#00513a]' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>
                  <CheckCircle2 size={14} />
                  {hasValue ? 'Normal' : 'Indisponible'}
                </span>
              </div>
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className={`font-metric mt-2 text-[28px] font-semibold leading-none ${hasValue ? 'text-[#171d1a]' : 'text-slate-500'}`}>
                  {hasValue ? stat.value : 'Aucune donnée disponible maintenant'}
                </p>
              </div>
            </article>
          )
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        {summary.recentAlert ? (
          <article className="sht-card overflow-hidden border-l-4 border-l-[#ba1a1a]">
            <div className="flex flex-col gap-5 p-5 md:flex-row md:items-start md:justify-between">
              <div className="flex gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#ffdad6] text-[#ba1a1a]">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-[#ba1a1a] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Alerte non lue
                    </span>
                    <h2 className="text-xl font-semibold text-[#171d1a] dark:text-white">{summary.recentAlert.title}</h2>
                  </div>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-[#3d4943]">{summary.recentAlert.message}</p>
                </div>
              </div>
              <span className="text-xs font-medium text-[#6d7a73]">
                {summary.recentAlert.created_at ? new Date(summary.recentAlert.created_at).toLocaleString('fr-FR') : ''}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 border-t border-[#bccac1]/30 px-5 py-4">
              <a className="rounded-lg bg-[#00694c] px-4 py-2 text-sm font-semibold text-white" href="/notifications">
                Voir les alertes
              </a>
            </div>
          </article>
        ) : (
          <article className="sht-card overflow-hidden border-l-4 border-l-[#00694c]">
            <div className="flex gap-4 p-5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#eff5ef] text-[#00694c]">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#171d1a] dark:text-white">Aucune alerte active</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#3d4943]">
                  Aucune alerte non lue n'a ete detectee sur vos donnees recentes.
                </p>
              </div>
            </div>
          </article>
        )}

        <article className="rounded-xl border border-dashed border-[#68dbae] bg-[#eff5ef] p-5">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#00694c] text-white">
            <BrainCircuit size={21} />
          </div>
          <h2 className="mt-4 text-sm font-bold uppercase tracking-wider text-[#00694c]">Recommandation IA</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {recommendationsData?.success && recommendationsData?.data?.summary
              ? recommendationsData.data.summary
              : 'Aucune donnée disponible maintenant'}
          </p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard subtitle="Frequence cardiaque mesuree (donnees reelles)" title="Evolution du rythme cardiaque">
          {charts.heartRateData?.length > 0 ? (
            <ResponsiveContainer height="100%" width="100%">
              <AreaChart data={charts.heartRateData} margin={{ left: -18, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="heartRateGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                <XAxis axisLine={false} dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
                <YAxis axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#99f6e4', strokeWidth: 2 }} />
                <Area
                  dataKey="bpm"
                  fill="url(#heartRateGradient)"
                  name="BPM"
                  stroke="#0f766e"
                  strokeWidth={3}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center text-sm text-slate-500">Aucune donnée disponible maintenant</div>
          )}
        </ChartCard>

        <ChartCard subtitle="Poids mesure (donnees reelles)" title="Progression du poids">
          {charts.weightData?.length > 0 ? (
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={charts.weightData} margin={{ left: -18, right: 8, top: 8 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                <XAxis axisLine={false} dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
                <YAxis axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#bae6fd', strokeWidth: 2 }} />
                <Line
                  activeDot={{ r: 6, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 3 }}
                  dataKey="weight"
                  dot={{ r: 4, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
                  name="Weight kg"
                  stroke="#0284c7"
                  strokeWidth={3}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center text-sm text-slate-500">Aucune donnée disponible maintenant</div>
          )}
        </ChartCard>
      </section>

      <section className="grid gap-4">
        <article className="sht-card p-5">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-950">
            <CalendarCheck className="text-[#00694c]" size={22} />
            Prochains rendez-vous
          </h2>
          <div className="mt-4 divide-y divide-slate-100">
            {summary.upcomingAppointments && summary.upcomingAppointments.length > 0 ? (
              summary.upcomingAppointments.map((appointment) => (
                <div key={appointment.uid} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{appointment.reason || 'Rendez-vous medical'}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(appointment.appointment_date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}{' '}
                      a {appointment.appointment_time?.slice(0, 5)}
                    </p>
                  </div>
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                    {appointment.status === 'confirmed' ? 'Confirme' : 'Planifie'}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-3 text-sm text-slate-500">Aucune donnée disponible maintenant</p>
            )}
          </div>
        </article>
      </section>
    </div>
  )
}

export default DashboardPage
