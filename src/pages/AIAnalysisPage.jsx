import { useQuery } from '@tanstack/react-query'
import { BrainCircuit, CheckCircle2, Droplets, Footprints, Sparkles, TrendingUp } from 'lucide-react'

import { getLatestAIAnalysis } from '../services/aiAnalysisService'
import { LoadingSkeleton } from '../shared/ui/LoadingSkeleton'

const recommendationCards = [
  {
    title: 'Hydratation Critique',
    tag: 'Urgent',
    time: 'Il y a 15 min',
    text: "Votre taux d'hydratation est descendu sous le seuil recommande ce matin.",
    icon: Droplets,
    border: 'border-l-[#ba1a1a]',
    iconBox: 'bg-[#ffdad6] text-[#ba1a1a]',
    tagClass: 'bg-[#ba1a1a] text-white',
  },
  {
    title: 'Recuperation Cardiaque',
    tag: 'Important',
    time: 'Il y a 2 h',
    text: "L'analyse de votre activite suggere une fatigue accumulee. Preferez une marche legere.",
    icon: Footprints,
    border: 'border-l-[#0060a8]',
    iconBox: 'bg-[#d2e4ff] text-[#0060a8]',
    tagClass: 'bg-[#0060a8] text-white',
  },
]

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
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-[32px] font-semibold leading-tight text-[#171d1a] dark:text-white">
            Recommandations Personnalisees
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#6d7a73]">
            Analyse de vos donnees de sante en temps reel.
          </p>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-full bg-[#008560] px-4 py-2 text-sm font-semibold text-white shadow-sm">
          <BrainCircuit size={18} />
          Propulse par MedGemma
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {recommendationCards.map((card) => (
            <article className={`sht-card border-l-4 p-5 ${card.border}`} key={card.title}>
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div className="flex gap-4">
                  <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${card.iconBox}`}>
                    <card.icon size={24} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded px-2 py-1 text-[10px] font-semibold uppercase ${card.tagClass}`}>
                        {card.tag}
                      </span>
                      <h2 className="text-xl font-semibold text-[#171d1a] dark:text-white">{card.title}</h2>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#3d4943]">{card.text}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-[#6d7a73]">{card.time}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-[#bccac1]/30 pt-4">
                <button className="rounded-lg bg-[#00694c] px-4 py-2 text-sm font-semibold text-white" type="button">
                  Voir details
                </button>
                <button className="rounded-lg bg-[#e4eae4] px-4 py-2 text-sm font-medium text-[#3d4943]" type="button">
                  Marquer comme fait
                </button>
              </div>
            </article>
          ))}
        </div>

        <aside className="space-y-4">
          <article className="sht-card p-5">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#86f8c9]/35 text-[#00694c]">
              <TrendingUp size={24} />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-[#171d1a] dark:text-white">Derniere analyse</h2>
            <p className="mt-2 text-sm leading-6 text-[#3d4943]">{analysis.summary}</p>
          </article>
          <article className="rounded-xl border border-[#bccac1]/40 bg-[#eff5ef] p-5">
            <p className="text-sm font-medium text-[#6d7a73]">Niveau de risque</p>
            <p className="font-metric mt-2 text-[28px] font-semibold text-[#171d1a] dark:text-white">
              {analysis.riskLevel}
            </p>
            <p className="mt-1 text-sm text-[#6d7a73]">{analysis.confidence}% confiance</p>
          </article>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {insights.map((insight) => (
          <article className="sht-card p-5" key={insight}>
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-[#d2e4ff] text-[#0060a8]">
              <Sparkles size={20} />
            </div>
            <p className="text-sm leading-6 text-[#3d4943]">{insight}</p>
          </article>
        ))}
      </section>

      <section className="sht-card p-5">
        <h2 className="text-xl font-semibold text-[#171d1a] dark:text-white">Actions recommandees</h2>
        <div className="mt-4 grid gap-3">
          {analysis.recommendations.map((item) => (
            <div className="flex gap-3 rounded-lg bg-[#eff5ef] p-4 text-sm text-[#3d4943]" key={item}>
              <CheckCircle2 className="mt-0.5 text-[#00694c]" size={18} />
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default AIAnalysisPage
