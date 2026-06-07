import { AlertCircle, BrainCircuit, CheckCircle2 } from 'lucide-react'

function FieldError({ message }) {
  if (!message) {
    return null
  }

  return (
    <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-rose-600">
      <AlertCircle size={16} />
      {message}
    </p>
  )
}

export function StepReview({ errors, register, values }) {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold leading-tight text-[#171d1a] dark:text-white">Review & Submit</h2>
        <p className="mt-2 text-sm leading-6 text-[#3d4943]">
          Verifiez les informations avant de lancer la simulation d'analyse IA.
        </p>
      </div>

    <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
      <div className="space-y-4">
        <div className="rounded-xl border border-[#dee4de] bg-[#f5fbf5] p-5">
          <h3 className="font-semibold text-[#171d1a] dark:text-white">Revision des details</h3>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-[#6d7a73]">Pathologies</dt>
              <dd className="mt-1 text-[#171d1a] dark:text-white">
                {values.pathologies?.join(', ') || 'Non selectionne'}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-[#6d7a73]">Medicaments</dt>
              <dd className="mt-1 text-[#171d1a] dark:text-white">{values.currentMedication || 'Non fourni'}</dd>
            </div>
            <div>
              <dt className="font-medium text-[#6d7a73]">Allergies</dt>
              <dd className="mt-1 text-[#171d1a] dark:text-white">{values.knownAllergy || 'Non fourni'}</dd>
            </div>
            <div>
              <dt className="font-medium text-[#6d7a73]">Symptomes</dt>
              <dd className="mt-1 text-[#171d1a] dark:text-white">{values.symptoms?.join(', ') || 'Non selectionne'}</dd>
            </div>
          </dl>
          <div className="mt-4 rounded-lg bg-white p-4">
            <p className="text-sm font-medium text-[#6d7a73]">Contact d'urgence</p>
            <p className="mt-1 text-sm leading-6 text-[#3d4943]">
              {values.emergencyName || 'Non fourni'} - {values.emergencyPhone || 'Telephone non fourni'}
            </p>
          </div>
          <div className="mt-4 rounded-lg bg-[#eff5ef] p-4">
            <p className="text-sm font-medium text-[#6d7a73]">Question pour MediAssist</p>
            <p className="mt-1 text-sm leading-6 text-[#3d4943]">{values.description || 'Aucune question — analyse automatique des données'}</p>
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-[#dee4de] bg-[#eff5ef] p-4">
          <input className="mt-1 h-5 w-5 accent-[#00694c]" type="checkbox" {...register('consent')} />
          <span>
            <span className="block text-sm font-semibold text-[#171d1a] dark:text-white">Consentement IA</span>
            <span className="mt-1 block text-sm leading-6 text-[#3d4943]">
              Je comprends que cette demo frontend utilise une reponse IA simulee et ne remplace pas un avis medical.
            </span>
            <FieldError message={errors.consent?.message} />
          </span>
        </label>
      </div>

      <aside className="rounded-xl border border-[#68dbae] bg-[#eff5ef] p-5">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#00694c] text-white">
          <BrainCircuit size={22} />
        </div>
        <h3 className="mt-4 font-semibold text-[#171d1a] dark:text-white">Pret pour l analyse</h3>
        <p className="mt-2 text-sm leading-6 text-[#3d4943]">
          La demo simule une soumission securisee et retourne une reponse IA mockee.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/70 p-3 text-sm font-medium text-[#00694c]">
          <CheckCircle2 size={18} />
          Flux MVP frontend-only
        </div>
      </aside>
    </div>
    </div>
  )
}
