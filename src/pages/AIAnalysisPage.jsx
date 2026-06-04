import { BrainCircuit, ClipboardList } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { MediAssistChat } from '../features/chatbot/MediAssistChat'

function AIAnalysisPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const patientData = location.state?.patientData

  if (!patientData) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#e4eae4] text-[#3d4943]">
          <ClipboardList size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[#171d1a] dark:text-white">
            Aucune donnée patient disponible
          </h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-[#6d7a73]">
            Pour consulter MediAssist, veuillez d'abord renseigner vos indicateurs de santé
            dans le formulaire de symptômes.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl bg-[#00694c] px-6 py-3 text-sm font-bold text-white shadow transition hover:bg-[#008560]"
          type="button"
          onClick={() => navigate('/symptoms')}
        >
          <ClipboardList size={18} />
          Remplir le formulaire
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight text-[#171d1a] dark:text-white">
            Recommandations personnalisées
          </h1>
          <p className="mt-1 text-sm text-[#6d7a73]">
            Vos indicateurs ont été transmis à MediAssist pour une analyse complète.
          </p>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-full bg-[#008560] px-4 py-2 text-sm font-semibold text-white shadow-sm">
          <BrainCircuit size={18} />
          MedGemma 1.5
        </div>
      </div>

      <MediAssistChat patientData={patientData} />
    </div>
  )
}

export default AIAnalysisPage
