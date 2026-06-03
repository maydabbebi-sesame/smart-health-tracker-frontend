import { AlertCircle, BrainCircuit, CheckCircle2 } from 'lucide-react'

import { activityOptions, dietOptions, sleepOptions } from './formOptions'

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

function RadioGroup({ name, options, register }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <label
          className="cursor-pointer rounded-full border border-[#bccac1] bg-[#f5fbf5] px-4 py-2 text-sm text-[#3d4943] transition has-[:checked]:border-[#008560] has-[:checked]:bg-[#008560]/10 has-[:checked]:font-semibold has-[:checked]:text-[#008560]"
          key={option}
        >
          <input className="sr-only" type="radio" value={option} {...register(name)} />
          {option}
        </label>
      ))}
    </div>
  )
}

function CheckboxGroup({ name, options, register, selected = [] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <label
          className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
            selected.includes(option)
              ? 'border-[#008560] bg-[#008560]/10 font-semibold text-[#008560]'
              : 'border-[#bccac1] bg-[#f5fbf5] text-[#3d4943] hover:border-[#008560]'
          }`}
          key={option}
        >
          <input className="sr-only" type="checkbox" value={option} {...register(name)} />
          {selected.includes(option) && <CheckCircle2 size={14} />}
          {option}
        </label>
      ))}
    </div>
  )
}

export function StepLifestyleReview({ errors, register, values }) {
  const imc =
    values.weight && values.height ? (Number(values.weight) / (Number(values.height) / 100) ** 2).toFixed(1) : 'N/A'

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-[22px] font-bold leading-tight text-[#171d1a] dark:text-white">Mode de vie & revision</h2>
        <p className="mt-2 text-sm leading-6 text-[#3d4943]">
          Habitudes quotidiennes et validation finale avant la simulation de soumission IA.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">
            Activite physique
          </label>
          <RadioGroup name="physicalActivity" options={activityOptions} register={register} />
        </div>

        <div>
          <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">
            Alimentation
          </label>
          <CheckboxGroup name="diet" options={dietOptions} register={register} selected={values.diet} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">
              Qualite du sommeil
            </label>
            <RadioGroup name="sleepQuality" options={sleepOptions} register={register} />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">Niveau de stress</span>
              <span className="font-metric text-lg font-semibold text-[#00694c]">{values.stressLevel || 1}/5</span>
            </div>
            <input className="mt-3 w-full accent-[#00694c]" max="5" min="1" type="range" {...register('stressLevel')} />
          </div>
        </div>

        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">Notes libres</span>
          <textarea
            className="mt-2 min-h-28 w-full resize-y rounded-lg border border-[#bccac1] bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#008560] focus:ring-2 focus:ring-[#008560]"
            maxLength={600}
            placeholder="Contexte additionnel utile pour l'analyse..."
            {...register('description')}
          />
          <FieldError message={errors.description?.message} />
        </label>
      </div>

      <div className="mt-6 rounded-xl border border-[#68dbae] bg-[#eff5ef] p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#00694c] text-white">
            <BrainCircuit size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-[#171d1a] dark:text-white">Resume payload IA</h3>
            <p className="mt-2 text-sm leading-6 text-[#3d4943]">
              Patient : {values.age || '--'} ans, {values.biologicalSex || '--'}, {values.weight || '--'} kg,
              {values.height || '--'} cm (IMC : {imc}). Symptomes : {values.symptoms?.join(', ') || '--'}.
            </p>
          </div>
        </div>
      </div>

      <label className="mt-5 flex items-start gap-3 rounded-xl border border-[#dee4de] bg-[#f5fbf5] p-4">
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
  )
}
