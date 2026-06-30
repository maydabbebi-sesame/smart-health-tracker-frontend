import { BrainCircuit, ShieldCheck } from 'lucide-react'

import { SymptomForm } from '../../features/symptom-form/SymptomForm'
import { useTranslation } from '../../i18n/useTranslation'

function useHelperCards(t) {
  return [
    {
      title: t('symptomForm.page.helperCard.dataSecurity.title', 'Sécurité des données'),
      text: t(
        'symptomForm.page.helperCard.dataSecurity.text',
        'Les données de santé sont simulées côté frontend et préparées pour un flux backend sécurisé.',
      ),
      icon: ShieldCheck,
    },
    {
      title: t('symptomForm.page.helperCard.aiAnalysis.title', 'Analyse IA'),
      text: t(
        'symptomForm.page.helperCard.aiAnalysis.text',
        'Le formulaire produit un payload clair pour le futur modele IA via API/service.',
      ),
      icon: BrainCircuit,
    },
  ]
}

function Symptoms() {
  const { t } = useTranslation()
  const helperCards = useHelperCards(t)

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col items-center py-4 sm:py-8">
      <h1 className="sr-only">{t('symptomForm.page.heading', 'Suivi de Sante - Analyse des symptomes')}</h1>
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
