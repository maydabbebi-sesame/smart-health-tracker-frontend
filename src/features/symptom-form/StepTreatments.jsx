import { AlertCircle, Plus, X } from 'lucide-react'
import { useFieldArray } from 'react-hook-form'

import { adherenceOptions } from './formOptions'

function FieldError({ message }) {
  if (!message) return null
  return (
    <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-rose-600">
      <AlertCircle size={16} />
      {message}
    </p>
  )
}

export function StepTreatments({ control, errors, register, values }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'currentMedications' })

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-[22px] font-bold leading-tight text-[#171d1a] dark:text-white">Traitements en cours</h2>
        <p className="mt-2 text-sm leading-6 text-[#3d4943]">
          Medicaments et complements actuels, indispensables pour detecter les interactions medicamenteuses.
        </p>
      </div>

      <div>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">
          Medicaments actuels <span className="text-[#ba1a1a]">*</span>
        </span>
        <div className="mt-2 flex gap-2">
          {['Oui', 'Non'].map((option) => (
            <label
              className="cursor-pointer rounded-full border border-[#bccac1] bg-[#f5fbf5] px-4 py-2 text-sm text-[#3d4943] transition has-[:checked]:border-[#008560] has-[:checked]:bg-[#008560]/10 has-[:checked]:font-semibold has-[:checked]:text-[#008560]"
              key={option}
            >
              <input className="sr-only" type="radio" value={option} {...register('hasCurrentMedications')} />
              {option}
            </label>
          ))}
        </div>
        <FieldError message={errors.hasCurrentMedications?.message} />
      </div>

      {values.hasCurrentMedications === 'Oui' && (
        <div className="mt-5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">
            Nom + dose + frequence
          </span>
          <div className="mt-3 space-y-2">
            {fields.map((field, index) => (
              <div className="flex items-center gap-2" key={field.id}>
                <input
                  className="h-12 flex-1 rounded-lg border border-[#bccac1] bg-white px-4 text-sm outline-none transition focus:border-[#008560] focus:ring-2 focus:ring-[#008560]"
                  placeholder="Ex: Metformine 1000mg 2x/j"
                  type="text"
                  {...register(`currentMedications.${index}.value`)}
                />
                {fields.length > 1 && (
                  <button
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#ffdad6] bg-[#ffdad6] text-[#93000a] transition hover:bg-[#ffb4ab]"
                    type="button"
                    onClick={() => remove(index)}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-dashed border-[#bccac1] px-4 py-2 text-sm text-[#3d4943] transition hover:bg-[#eff5ef]"
            type="button"
            onClick={() => append({ value: '' })}
          >
            <Plus size={15} />
            Ajouter un medicament
          </button>
          <FieldError message={errors.currentMedications?.message} />
        </div>
      )}

      <div className="mt-5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">
          Complements / phytotherapie
        </span>
        <div className="mt-2 flex gap-2">
          {['Oui', 'Non'].map((option) => (
            <label
              className="cursor-pointer rounded-full border border-[#bccac1] bg-[#f5fbf5] px-4 py-2 text-sm text-[#3d4943] transition has-[:checked]:border-[#008560] has-[:checked]:bg-[#008560]/10 has-[:checked]:font-semibold has-[:checked]:text-[#008560]"
              key={option}
            >
              <input className="sr-only" type="radio" value={option} {...register('hasSupplements')} />
              {option}
            </label>
          ))}
        </div>
      </div>

      {values.hasSupplements === 'Oui' && (
        <label className="mt-5 block">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">
            Plantes, vitamines...
          </span>
          <input
            className="mt-2 h-12 w-full rounded-lg border border-[#bccac1] bg-white px-4 text-sm outline-none transition focus:border-[#008560] focus:ring-2 focus:ring-[#008560]"
            placeholder="Ex: vitamine D, ginkgo, millepertuis..."
            type="text"
            {...register('supplements')}
          />
          <FieldError message={errors.supplements?.message} />
        </label>
      )}

      {values.hasCurrentMedications === 'Oui' && (
        <div className="mt-5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">Observance du traitement</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {adherenceOptions.map((option) => (
              <label
                className="cursor-pointer rounded-full border border-[#bccac1] bg-[#f5fbf5] px-4 py-2 text-sm text-[#3d4943] transition has-[:checked]:border-[#008560] has-[:checked]:bg-[#008560]/10 has-[:checked]:font-semibold has-[:checked]:text-[#008560]"
                key={option}
              >
                <input className="sr-only" type="radio" value={option} {...register('treatmentAdherence')} />
                {option}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
