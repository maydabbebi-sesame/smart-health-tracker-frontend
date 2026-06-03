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
  Bar,
  BarChart,
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

  if (isSummaryLoading || isChartsLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 md:grid-cols-12">
        <div className="flex flex-col justify-center md:col-span-8">
          <h1 className="text-[32px] font-semibold leading-tight text-[#171d1a] dark:text-white">Bonjour Maya</h1>
          <p className="mt-3 flex items-center gap-2 text-base text-[#6d7a73]">
            <CalendarDays size={19} />
            Mardi 2 Juin 2026
          </p>
        </div>
        <article className="sht-card flex items-center justify-between p-5 md:col-span-4">
          <div>
            <h2 className="text-xl font-semibold text-[#171d1a] dark:text-white">Score Sante</h2>
            <p className="mt-1 text-sm text-[#6d7a73]">Excellente progression</p>
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
            <span className="font-metric absolute text-lg font-semibold text-[#00694c]">78</span>
          </div>
        </article>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.stats.map((stat) => {
          const StatIcon = statIcons[stat.icon]

          return (
            <article key={stat.label} className="sht-card p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#eff5ef] text-[#00694c]">
                  <StatIcon size={23} />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#86f8c9]/35 px-2 py-1 text-xs font-semibold text-[#00513a]">
                  <CheckCircle2 size={14} />
                  Normal
                </span>
              </div>
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="font-metric mt-2 text-[28px] font-semibold leading-none text-[#171d1a] dark:text-white">
                  {stat.value}
                </p>
              </div>
            </article>
          )
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard subtitle="Average resting BPM over the last 7 days" title="Evolution de sante (7 jours)">
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart data={charts.heartRateData} margin={{ left: -18, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="heartRateGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
              <XAxis axisLine={false} dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
              <YAxis
                axisLine={false}
                domain={[60, 90]}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickLine={false}
              />
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
        </ChartCard>

        <ChartCard subtitle="Weekly trend based on mock weigh-ins" title="Progression du poids">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={charts.weightData} margin={{ left: -18, right: 8, top: 8 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
              <XAxis axisLine={false} dataKey="week" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
              <YAxis
                axisLine={false}
                domain={[70, 73]}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickLine={false}
              />
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
        </ChartCard>
      </section>

      <ChartCard subtitle="Mock weekly steps with sleep context" title="Activite sante hebdomadaire">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={charts.activityData} margin={{ left: -18, right: 8, top: 8 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
            <XAxis axisLine={false} dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
            <YAxis axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey="steps" fill="#14b8a6" name="Steps" radius={[8, 8, 0, 0]} />
            <Bar dataKey="sleep" fill="#38bdf8" name="Sleep hrs" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <article className="sht-card p-5">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-950">
            <CalendarCheck className="text-[#00694c]" size={22} />
            Prochains rendez-vous
          </h2>
          <div className="mt-4 divide-y divide-slate-100">
            {summary.healthPlanItems.map((item, index) => (
              <div key={item} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">{item}</p>
                  <p className="text-sm text-slate-500">Action personnelle #{index + 1}</p>
                </div>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                  Planifie
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-dashed border-[#68dbae] bg-[#eff5ef] p-5">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#00694c] text-white">
            <BrainCircuit size={21} />
          </div>
          <h2 className="mt-4 text-sm font-bold uppercase tracking-wider text-[#00694c]">AI Recommendation</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Recent entries suggest fatigue is most common after shorter sleep. Full analysis is available in the AI
            Analysis section.
          </p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="sht-card border-l-4 border-l-[#ba1a1a] p-5">
          <div className="flex gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#ffdad6] text-[#ba1a1a]">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2 className="font-semibold text-[#171d1a] dark:text-white">Alerte a verifier</h2>
              <p className="mt-2 text-sm leading-6 text-[#3d4943]">
                Fatigue repetee et sommeil court detectes dans les donnees mockees de la semaine.
              </p>
            </div>
          </div>
        </article>

        <article className="sht-card p-5">
          <p className="sht-kicker">Objectif</p>
          <h2 className="mt-2 font-semibold text-[#171d1a] dark:text-white">Hydratation quotidienne</h2>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#dce5df]">
            <div className="h-full w-[72%] rounded-full bg-[#00694c]" />
          </div>
          <p className="mt-3 text-sm text-[#6d7a73]">72% de l'objectif journalier atteint.</p>
        </article>

        <article className="sht-card p-5">
          <p className="sht-kicker">Backend</p>
          <h2 className="mt-2 font-semibold text-[#171d1a] dark:text-white">Contrats API prets</h2>
          <p className="mt-2 text-sm leading-6 text-[#3d4943]">
            Les donnees du dashboard passent par des services frontend mockes et pourront etre remplacees par Axios.
          </p>
        </article>
      </section>
    </div>
  )
}

export default DashboardPage
