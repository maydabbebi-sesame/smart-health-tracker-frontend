import { Activity, BrainCircuit, ShieldCheck } from 'lucide-react'

import { SymptomForm } from '../../features/symptom-form/SymptomForm'

const helperCards = [
  {
    title: 'Private by design',
    text: 'This MVP keeps submissions in the browser and uses mocked responses.',
    icon: ShieldCheck,
  },
  {
    title: 'Structured intake',
    text: 'Step-by-step fields make symptom reports easier to review.',
    icon: Activity,
  },
  {
    title: 'AI-ready output',
    text: 'The final payload is shaped for a future analysis API.',
    icon: BrainCircuit,
  },
]

function Symptoms() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Symptom intake</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">Symptoms</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Capture symptoms, personal context, and a free-text description in a polished frontend-only demo flow.
          </p>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        {helperCards.map((card) => (
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={card.title}>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700">
              <card.icon size={21} />
            </div>
            <h2 className="mt-4 font-semibold text-slate-950">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{card.text}</p>
          </article>
        ))}
      </section>

      <SymptomForm />
    </div>
  )
}

export default Symptoms
