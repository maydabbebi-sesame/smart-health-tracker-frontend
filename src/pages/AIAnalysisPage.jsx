import { useQuery } from '@tanstack/react-query'
import { BrainCircuit, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react'

import { getLatestAIAnalysis } from '../services/aiAnalysisService'
import { LoadingSkeleton } from '../shared/ui/LoadingSkeleton'

function AIAnalysisPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['ai-analysis-latest'],
    queryFn: getLatestAIAnalysis,
  })

  if (isLoading) {
    return <LoadingSkeleton />
  }

  const { analysis, insights } = data

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">AI service</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">AI Analysis</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              API-ready health insights generated from symptom reports and history data in this frontend-only MVP.
            </p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-600 text-white">
            <BrainCircuit size={24} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan-50 text-cyan-700">
              <TrendingUp size={22} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Latest mocked analysis</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">{analysis.summary}</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-medium text-amber-700">Risk level</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{analysis.riskLevel}</p>
          <p className="mt-2 text-sm text-slate-600">{analysis.confidence}% confidence</p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {insights.map((insight) => (
          <article key={insight} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-cyan-50 text-cyan-700">
              <Sparkles size={20} />
            </div>
            <p className="text-sm leading-6 text-slate-700">{insight}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-950">Recommendations</h2>
        <div className="mt-4 grid gap-3">
          {analysis.recommendations.map((item) => (
            <div className="flex gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700" key={item}>
              <CheckCircle2 className="mt-0.5 text-teal-600" size={18} />
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default AIAnalysisPage
