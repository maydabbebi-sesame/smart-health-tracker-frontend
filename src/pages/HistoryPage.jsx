import { useQuery } from '@tanstack/react-query'
import { CalendarDays, FileText, Phone, Plus, ShieldAlert, Syringe } from 'lucide-react'

import { getHealthHistory } from '../services/healthHistoryService'
import { LoadingSkeleton } from '../shared/ui/LoadingSkeleton'

const historyCategories = ['General', 'Allergies', 'Traitements', 'Chirurgie', 'Famille']
const allergies = ['Penicilline', 'Pollen', 'Fruits de mer']
const treatments = ['Vitamine D', 'Magnesium', 'Paracetamol si besoin']
const vaccinations = [
  { name: 'COVID-19', date: '2025', status: 'A jour' },
  { name: 'Grippe', date: '2026', status: 'Planifie' },
  { name: 'Tetanos', date: '2022', status: 'A jour' },
]

function HistoryPage() {
  const { data: records, isLoading } = useQuery({
    queryKey: ['health-history'],
    queryFn: getHealthHistory,
  })

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-[32px] font-semibold leading-tight text-[#171d1a] dark:text-white">
            Antecedents medicaux
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#6d7a73]">
            Centralisez les informations utiles pour le futur backend medical.
          </p>
        </div>
        <button className="flex w-fit items-center gap-2 rounded-lg bg-[#00694c] px-5 py-3 text-sm font-semibold text-white" type="button">
          <Plus size={18} />
          Ajouter une entree
        </button>
      </div>

      <section className="sht-card p-5">
        <div className="flex flex-wrap gap-3">
          {historyCategories.map((category, index) => (
            <button
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                index === 0
                  ? 'border-[#008560] bg-[#008560]/10 text-[#00694c]'
                  : 'border-[#bccac1] bg-[#f5fbf5] text-[#3d4943] hover:border-[#008560] hover:text-[#00694c]'
              }`}
              key={category}
              type="button"
            >
              {category}
            </button>
          ))}
          <button
            className="rounded-full border border-dashed border-[#bccac1] px-4 py-2 text-sm font-medium italic text-[#6d7a73] hover:bg-[#eff5ef]"
            type="button"
          >
            + Autre
          </button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <article className="sht-card p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#86f8c9]/35 text-[#00694c]">
                  <FileText size={21} />
                </div>
                <h2 className="text-xl font-semibold text-[#171d1a] dark:text-white">Historique Medical</h2>
              </div>
              <button className="text-sm font-semibold text-[#00694c]" type="button">
                Ajouter
              </button>
            </div>

            <div className="grid gap-3">
              {records.map((record) => (
                <div
                  className="flex flex-col gap-3 rounded-lg bg-[#eff5ef] p-4 sm:flex-row sm:items-center"
                  key={record.title}
                >
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-white text-[#00694c]">
                    <FileText size={19} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#171d1a] dark:text-white">{record.title}</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-[#6d7a73]">
                      <CalendarDays size={15} />
                      {record.date}
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-[#86f8c9]/35 px-3 py-1 text-xs font-semibold text-[#00694c]">
                    {record.type}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="sht-card p-5">
            <div className="mb-4 flex items-center gap-3">
              <ShieldAlert className="text-[#ba1a1a]" size={22} />
              <h2 className="text-xl font-semibold text-[#171d1a] dark:text-white">Allergies connues</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {allergies.map((item) => (
                <span className="rounded-full bg-[#ffdad6] px-3 py-1 text-sm font-semibold text-[#93000a]" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </article>
        </div>

        <aside className="space-y-6">
          <article className="sht-card p-5">
            <div className="mb-4 flex items-center gap-3">
              <Phone className="text-[#00694c]" size={22} />
              <h3 className="font-semibold text-[#171d1a] dark:text-white">Contact d'urgence</h3>
            </div>
            <p className="font-semibold text-[#171d1a] dark:text-white">Sarah Ben Ali</p>
            <p className="mt-1 text-sm text-[#6d7a73]">+216 22 000 000</p>
            <p className="mt-1 text-sm text-[#6d7a73]">Relation : Soeur</p>
          </article>

          <article className="sht-card p-5">
            <h3 className="font-semibold text-[#171d1a] dark:text-white">Traitements actifs</h3>
            <div className="mt-4 space-y-3">
              {treatments.map((item) => (
                <div className="rounded-lg bg-[#eff5ef] p-3 text-sm text-[#3d4943]" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </article>

          <article className="sht-card p-5">
            <div className="mb-4 flex items-center gap-3">
              <Syringe className="text-[#0060a8]" size={22} />
              <h3 className="font-semibold text-[#171d1a] dark:text-white">Carnet de Vaccination</h3>
            </div>
            <div className="space-y-3">
              {vaccinations.map((item) => (
                <div className="flex items-center justify-between gap-3 rounded-lg bg-[#eff5ef] p-3" key={item.name}>
                  <div>
                    <p className="font-medium text-[#171d1a] dark:text-white">{item.name}</p>
                    <p className="text-xs text-[#6d7a73]">{item.date}</p>
                  </div>
                  <span className="rounded-full bg-[#d2e4ff] px-2 py-1 text-xs font-semibold text-[#004880]">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </div>
  )
}

export default HistoryPage
