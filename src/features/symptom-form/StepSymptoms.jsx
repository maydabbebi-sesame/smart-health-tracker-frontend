import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

import { durationOptions, generalStateOptions, painLocationOptions, symptomOptions, triggerOptions } from './formOptions'

function FieldError({ message }) {
  if (!message) {
    return null
  }

  return (
    <p className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-rose-600">
      <AlertCircle size={16} />
      {message}
    </p>
  )
}

function TagGroup({ name, options, register, selected = [], setValue }) {
  const [isAdding, setIsAdding] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const mergedOptions = [...options, ...selected.filter((item) => !options.includes(item))]

  function addCustomOption() {
    const nextValue = customValue.trim()

    if (!nextValue) {
      return
    }

    setValue(name, Array.from(new Set([...selected, nextValue])), {
      shouldDirty: true,
      shouldValidate: true,
    })
    setCustomValue('')
    setIsAdding(false)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {mergedOptions.map((option) => {
        const isSelected = selected.includes(option)

        return (
          <label
            className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
              isSelected
                ? 'border-[#008560] bg-[#008560]/10 font-semibold text-[#008560]'
                : 'border-[#bccac1] bg-[#f5fbf5] text-[#3d4943] hover:border-[#008560]'
            }`}
            key={option}
          >
            <input className="sr-only" type="checkbox" value={option} {...register(name)} />
            {isSelected && <CheckCircle2 size={14} />}
            {option}
          </label>
        )
      })}
      {isAdding ? (
        <span className="inline-flex items-center gap-2">
          <input
            className="h-10 w-40 rounded-full border border-[#008560] bg-white px-4 text-sm outline-none ring-2 ring-[#008560]/20"
            placeholder="Autre..."
            type="text"
            value={customValue}
            onChange={(event) => setCustomValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addCustomOption()
              }
            }}
          />
          <button
            className="rounded-full bg-[#00694c] px-4 py-2 text-sm font-semibold text-white"
            type="button"
            onClick={addCustomOption}
          >
            Ajouter
          </button>
        </span>
      ) : (
        <button
          className="rounded-full border border-dashed border-[#bccac1] px-4 py-2 text-sm italic text-[#3d4943] transition hover:bg-[#eaefea]"
          type="button"
          onClick={() => setIsAdding(true)}
        >
          + Autre
        </button>
      )}
    </div>
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

export function StepSymptoms({ errors, register, selectedSymptoms = [], setValue, values }) {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-[22px] font-bold leading-tight text-[#171d1a] dark:text-white">Symptomes actuels</h2>
        <p className="mt-2 text-sm leading-6 text-[#3d4943]">
          Ressenti du patient au moment de la consultation, point d'entree principal de chaque session.
        </p>
      </div>

      <div>
        <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">
          Symptomes principaux
        </label>
        <TagGroup
          name="symptoms"
          options={symptomOptions}
          register={register}
          selected={selectedSymptoms}
          setValue={setValue}
        />
        <FieldError message={errors.symptoms?.message} />
      </div>

      <div className="mt-6 rounded-xl border border-[#dee4de] bg-[#f5fbf5] p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">
              Intensite de la douleur
            </span>
            <p className="mt-1 text-xs text-[#6d7a73]">EVA 0 a 10 - conditionnel si symptome douloureux.</p>
          </div>
          <span className="font-metric text-lg font-semibold text-[#00694c]">{values.painIntensity || 0}/10</span>
        </div>
        <input className="mt-4 w-full accent-[#00694c]" max="10" min="0" type="range" {...register('painIntensity')} />
        <FieldError message={errors.painIntensity?.message} />
      </div>

      <label className="mt-5 block">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">
          Description courte des symptomes
        </span>
        <input
          className="mt-2 h-12 w-full rounded-lg border border-[#bccac1] bg-white px-4 text-sm outline-none transition focus:border-[#008560] focus:ring-2 focus:ring-[#008560]"
          placeholder="Ex: fatigue intense, maux de tete..."
          type="text"
          {...register('otherSymptoms')}
        />
      </label>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">
            Duree des symptomes
          </label>
          <RadioGroup name="symptomDuration" options={durationOptions} register={register} />
          <FieldError message={errors.symptomDuration?.message} />
        </div>

        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">
            Localisation de la douleur
          </span>
          <div className="mt-2">
            <TagGroup
              name="painLocation"
              options={painLocationOptions}
              register={register}
              selected={values.painLocation}
              setValue={setValue}
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">
          Facteurs declenchants
        </label>
        <TagGroup
          name="triggers"
          options={triggerOptions}
          register={register}
          selected={values.triggers}
          setValue={setValue}
        />
      </div>

      <div className="mt-6">
        <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">
          Etat general subjectif
        </label>
        <RadioGroup name="generalState" options={generalStateOptions} register={register} />
      </div>
    </div>
  )
}
