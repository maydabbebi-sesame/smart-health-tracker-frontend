import { useQuery } from '@tanstack/react-query'
import { Activity, Bell, BrainCircuit, CalendarCheck, HeartPulse, Thermometer } from 'lucide-react'
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
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="font-semibold text-slate-950">{title}</h2>
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
      <section className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Patient dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Good morning, Maya</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Your health indicators are stable. Continue tracking symptoms and reviewing AI insights.
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Next reminder</p>
            <p className="mt-1 flex items-center gap-2 font-semibold text-slate-950">
              <CalendarCheck size={18} className="text-teal-600" />
              Medication at 20:00
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.stats.map((stat) => {
          const StatIcon = statIcons[stat.icon]

          return (
          <article key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{stat.value}</p>
              </div>
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700">
                <StatIcon size={22} />
              </div>
            </div>
          </article>
          )
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard subtitle="Average resting BPM over the last 7 days" title="Heart rate">
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

        <ChartCard subtitle="Weekly trend based on mock weigh-ins" title="Weight progress">
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

      <ChartCard subtitle="Mock weekly steps with sleep context" title="Weekly health activity">
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
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Today&apos;s health plan</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {summary.healthPlanItems.map((item, index) => (
                <div key={item} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{item}</p>
                    <p className="text-sm text-slate-500">Personal task #{index + 1}</p>
                  </div>
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                    Due
                  </span>
                </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-600 text-white">
            <BrainCircuit size={21} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-950">AI analysis preview</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Recent entries suggest fatigue is most common after shorter sleep. Full analysis is available in the AI
            Analysis section.
          </p>
        </article>
      </section>
    </div>
  )
}

export default DashboardPage
