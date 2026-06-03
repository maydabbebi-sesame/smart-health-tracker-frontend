import { BrainCircuit, ShieldCheck } from 'lucide-react'

import { SymptomForm } from '../../features/symptom-form/SymptomForm'

const helperCards = [
  {
    title: 'Securite des donnees',
    text: 'Les donnees de sante sont simulees cote frontend et preparees pour un flux backend securise.',
    icon: ShieldCheck,
  },
  {
    title: 'Analyse IA',
    text: 'Le formulaire produit un payload clair pour le futur modele IA via API/service.',
    icon: BrainCircuit,
  },
]

function Symptoms() {
  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col items-center py-4 sm:py-8">
      <h1 className="sr-only">Suivi de Sante - Analyse des symptomes</h1>
      <SymptomForm />

      <aside className="mt-8 grid w-full gap-4 md:grid-cols-2">
        {helperCards.map((card) => (
          <article
            className="flex items-start gap-3 rounded-lg border border-[#68dbae]/20 bg-[#00694c]/[0.03] p-4"
            key={card.title}
          >
            <card.icon className="mt-0.5 shrink-0 text-[#00694c]" size={22} />
            <div>
              <h2 className="text-sm font-bold text-[#00513a]">{card.title}</h2>
              <p className="mt-1 text-xs leading-5 text-[#3d4943]">{card.text}</p>
            </div>
          </article>
        ))}
      </aside>
    </div>
  )
}

export default Symptoms
