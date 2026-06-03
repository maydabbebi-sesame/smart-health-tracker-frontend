import { AlertCircle } from 'lucide-react'

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

function ChoiceGroup({ label, name, options, register }) {
  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-wide text-[#171d1a]">
        {label} <span className="text-[#ba1a1a]">*</span>
      </span>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            className="cursor-pointer rounded-full border border-[#bccac1] bg-[#f5fbf5] px-4 py-2 text-sm text-[#3d4943] transition has-[:checked]:border-[#008560] has-[:checked]:bg-[#008560]/10 has-[:checked]:font-semibold has-[:checked]:text-[#008560]"
            key={option.value}
          >
            <input className="sr-only" required type="radio" value={option.value} {...register(name)} />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  )
}

export function StepPersonalInfo({ errors, register, values }) {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-[22px] font-bold leading-tight text-[#171d1a] dark:text-white">Donnees personnelles</h2>
        <p className="mt-2 text-sm leading-6 text-[#3d4943]">
          Informations de base collectees une seule fois pour contextualiser tous les modeles LLM.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#171d1a]">
            Age <span className="text-[#ba1a1a]">*</span>
          </span>
          <input
            className="mt-2 h-12 w-full rounded-lg border border-[#bccac1] bg-white px-4 text-sm outline-none transition focus:border-[#008560] focus:ring-2 focus:ring-[#008560]"
            inputMode="numeric"
            placeholder="Ex: 45"
            required
            type="number"
            {...register('age')}
          />
          <FieldError message={errors.age?.message} />
        </label>

        <ChoiceGroup
          label="Sexe biologique"
          name="biologicalSex"
          options={[
            { label: 'M', value: 'M' },
            { label: 'F', value: 'F' },
            { label: 'Autre', value: 'Autre' },
          ]}
          register={register}
        />

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#171d1a]">
            Poids <span className="text-[#ba1a1a]">*</span>
          </span>
          <input
            className="mt-2 h-12 w-full rounded-lg border border-[#bccac1] bg-white px-4 text-sm outline-none transition focus:border-[#008560] focus:ring-2 focus:ring-[#008560]"
            inputMode="decimal"
            placeholder="Ex: 68.5"
            required
            type="number"
            {...register('weight')}
          />
          <FieldError message={errors.weight?.message} />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#171d1a]">
            Taille <span className="text-[#ba1a1a]">*</span>
          </span>
          <input
            className="mt-2 h-12 w-full rounded-lg border border-[#bccac1] bg-white px-4 text-sm outline-none transition focus:border-[#008560] focus:ring-2 focus:ring-[#008560]"
            inputMode="numeric"
            placeholder="Ex: 170"
            required
            type="number"
            {...register('height')}
          />
          <FieldError message={errors.height?.message} />
        </label>
      </div>

      <FieldError message={errors.biologicalSex?.message} />

      {values.biologicalSex === 'F' && (
        <div className="mt-6 rounded-xl border border-[#dee4de] bg-[#f5fbf5] p-4">
          <ChoiceGroup
            label="Grossesse en cours"
            name="pregnancyStatus"
            options={[
              { label: 'Oui', value: 'Oui' },
              { label: 'Non', value: 'Non' },
              { label: 'NSP', value: 'NSP' },
            ]}
            register={register}
          />
          <FieldError message={errors.pregnancyStatus?.message} />
        </div>
      )}
    </div>
  )
}
