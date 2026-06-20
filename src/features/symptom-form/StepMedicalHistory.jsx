import { AlertCircle, CheckCircle2, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useFieldArray } from 'react-hook-form'

import { useTranslation } from '../../i18n/useTranslation'
import { chronicDiseaseOptions, familyHistoryOptions } from './formOptions'

const AUCUNE = 'Aucune pathologie connue'

function FieldError({ message }) {
  if (!message) return null
  return (
    <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-rose-600">
      <AlertCircle size={16} />
      {message}
    </p>
  )
}

function ChronicDiseaseTagGroup({ name, optionLabels, options, selected = [], setValue, t }) {
  const [isAdding, setIsAdding] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const mergedOptions = [...options, ...selected.filter((item) => !options.includes(item))]

  function handleToggle(option) {
    let next
    if (option === AUCUNE) {
      next = selected.includes(AUCUNE) ? [] : [AUCUNE]
    } else if (selected.includes(AUCUNE)) {
      next = [option]
    } else {
      next = selected.includes(option)
        ? selected.filter((o) => o !== option)
        : [...selected, option]
    }
    setValue(name, next, { shouldDirty: true, shouldValidate: true })
  }

  function addCustomOption() {
    const nextValue = customValue.trim()
    if (!nextValue) return
    const next = selected.includes(AUCUNE)
      ? [nextValue]
      : Array.from(new Set([...selected, nextValue]))
    setValue(name, next, { shouldDirty: true, shouldValidate: true })
    setCustomValue('')
    setIsAdding(false)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {mergedOptions.map((option) => {
        const isSelected = selected.includes(option)
        const isAucune = option === AUCUNE
        return (
          <label
            className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
              isSelected
                ? isAucune
                  ? 'border-[#6b7280] bg-[#6b7280]/10 font-semibold text-[#374151]'
                  : 'border-[#008560] bg-[#008560]/10 font-semibold text-[#008560]'
                : 'border-[#bccac1] bg-[#f5fbf5] text-[#3d4943] hover:border-[#008560]'
            }`}
            key={option}
            onClick={(e) => { e.preventDefault(); handleToggle(option) }}
          >
            <input className="sr-only" type="checkbox" readOnly checked={isSelected} onChange={() => {}} />
            {isSelected && <CheckCircle2 size={14} />}
            {optionLabels?.[option] ?? option}
          </label>
        )
      })}
      {!selected.includes(AUCUNE) && (
        isAdding ? (
          <span className="inline-flex items-center gap-2">
            <input
              className="h-10 w-40 rounded-full border border-[#008560] bg-white px-4 text-sm outline-none ring-2 ring-[#008560]/20"
              placeholder={t('symptomForm.stepMedicalHistory.otherPlaceholder', 'Autre...')}
              type="text"
              value={customValue}
              onChange={(event) => setCustomValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') { event.preventDefault(); addCustomOption() }
              }}
            />
            <button
              className="rounded-full bg-[#00694c] px-4 py-2 text-sm font-semibold text-white"
              type="button"
              onClick={addCustomOption}
            >
              {t('symptomForm.stepMedicalHistory.addButton', 'Ajouter')}
            </button>
          </span>
        ) : (
          <button
            className="rounded-full border border-dashed border-[#bccac1] px-4 py-2 text-sm italic text-[#3d4943] transition hover:bg-[#eaefea]"
            type="button"
            onClick={() => setIsAdding(true)}
          >
            {t('symptomForm.stepMedicalHistory.addOtherButton', '+ Autre')}
          </button>
        )
      )}
    </div>
  )
}

function TagGroup({ name, optionLabels, options, register, selected = [], setValue, t }) {
  const [isAdding, setIsAdding] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const mergedOptions = [...options, ...selected.filter((item) => !options.includes(item))]

  function addCustomOption() {
    const nextValue = customValue.trim()
    if (!nextValue) return
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
            {optionLabels?.[option] ?? option}
          </label>
        )
      })}
      {isAdding ? (
        <span className="inline-flex items-center gap-2">
          <input
            className="h-10 w-40 rounded-full border border-[#008560] bg-white px-4 text-sm outline-none ring-2 ring-[#008560]/20"
            placeholder={t('symptomForm.stepMedicalHistory.otherPlaceholder', 'Autre...')}
            type="text"
            value={customValue}
            onChange={(event) => setCustomValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') { event.preventDefault(); addCustomOption() }
            }}
          />
          <button
            className="rounded-full bg-[#00694c] px-4 py-2 text-sm font-semibold text-white"
            type="button"
            onClick={addCustomOption}
          >
            {t('symptomForm.stepMedicalHistory.addButton', 'Ajouter')}
          </button>
        </span>
      ) : (
        <button
          className="rounded-full border border-dashed border-[#bccac1] px-4 py-2 text-sm italic text-[#3d4943] transition hover:bg-[#eaefea]"
          type="button"
          onClick={() => setIsAdding(true)}
        >
          {t('symptomForm.stepMedicalHistory.addOtherButton', '+ Autre')}
        </button>
      )}
    </div>
  )
}

export function StepMedicalHistory({ control, errors, register, setValue, values }) {
  const { t } = useTranslation()
  const {
    append: appendAllergy,
    fields: allergyFields,
    remove: removeAllergy,
  } = useFieldArray({ control, name: 'drugAllergies' })

  const yesNoLabels = {
    Oui: t('symptomForm.stepMedicalHistory.yesOption', 'Oui'),
    Non: t('symptomForm.stepMedicalHistory.noOption', 'Non'),
  }

  const chronicDiseaseLabels = {
    'Aucune pathologie connue': t('symptomForm.stepMedicalHistory.chronicDiseaseOption.none', 'Aucune pathologie connue'),
    'Diabete T1/T2': t('symptomForm.stepMedicalHistory.chronicDiseaseOption.diabetes', 'Diabete T1/T2'),
    HTA: t('symptomForm.stepMedicalHistory.chronicDiseaseOption.hypertension', 'HTA'),
    Asthme: t('symptomForm.stepMedicalHistory.chronicDiseaseOption.asthma', 'Asthme'),
    BPCO: t('symptomForm.stepMedicalHistory.chronicDiseaseOption.copd', 'BPCO'),
    IRC: t('symptomForm.stepMedicalHistory.chronicDiseaseOption.ckd', 'IRC'),
    Cancer: t('symptomForm.stepMedicalHistory.chronicDiseaseOption.cancer', 'Cancer'),
    Cholesterol: t('symptomForm.stepMedicalHistory.chronicDiseaseOption.cholesterol', 'Cholesterol'),
  }

  const familyHistoryLabels = {
    Cancer: t('symptomForm.stepMedicalHistory.familyHistoryOption.cancer', 'Cancer'),
    Cardio: t('symptomForm.stepMedicalHistory.familyHistoryOption.cardio', 'Cardio'),
    Diabete: t('symptomForm.stepMedicalHistory.familyHistoryOption.diabetes', 'Diabete'),
    AVC: t('symptomForm.stepMedicalHistory.familyHistoryOption.stroke', 'AVC'),
    Alzheimer: t('symptomForm.stepMedicalHistory.familyHistoryOption.alzheimer', 'Alzheimer'),
  }

  const habitRows = [
    [
      t('symptomForm.stepMedicalHistory.tobaccoLabel', 'Tabac'),
      'tobacco',
      'tobaccoQuantity',
      t('symptomForm.stepMedicalHistory.tobaccoQuantityPlaceholder', 'cig/jour'),
    ],
    [
      t('symptomForm.stepMedicalHistory.alcoholLabel', 'Alcool'),
      'alcohol',
      'alcoholQuantity',
      t('symptomForm.stepMedicalHistory.alcoholQuantityPlaceholder', 'verres/semaine'),
    ],
  ]

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-[22px] font-bold leading-tight text-[#171d1a] dark:text-white">
          {t('symptomForm.stepMedicalHistory.title', 'Antécédents médicaux')}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#3d4943]">
          {t(
            'symptomForm.stepMedicalHistory.subtitle',
            'Historique médical du patient, utilisé pour éviter les recommandations trop génériques.',
          )}
        </p>
      </div>

      <div>
        <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">
          {t('symptomForm.stepMedicalHistory.chronicDiseasesLabel', 'Maladies chroniques')} <span className="text-[#ba1a1a]">*</span>
        </label>
        <ChronicDiseaseTagGroup
          name="chronicDiseases"
          optionLabels={chronicDiseaseLabels}
          options={chronicDiseaseOptions}
          selected={values.chronicDiseases}
          setValue={setValue}
          t={t}
        />
        <FieldError message={errors.chronicDiseases?.message} />
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">
            {t('symptomForm.stepMedicalHistory.drugAllergiesLabel', 'Allergies médicamenteuses')} <span className="text-[#ba1a1a]">*</span>
          </span>
          <div className="mt-2 flex gap-2">
            {['Oui', 'Non'].map((option) => (
              <label
                className="cursor-pointer rounded-full border border-[#bccac1] bg-[#f5fbf5] px-4 py-2 text-sm text-[#3d4943] transition has-[:checked]:border-[#008560] has-[:checked]:bg-[#008560]/10 has-[:checked]:font-semibold has-[:checked]:text-[#008560]"
                key={option}
              >
                <input className="sr-only" type="radio" value={option} {...register('hasDrugAllergies')} />
                {yesNoLabels[option]}
              </label>
            ))}
          </div>
          <FieldError message={errors.hasDrugAllergies?.message} />
        </div>

        {values.hasDrugAllergies === 'Oui' && (
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">
              {t('symptomForm.stepMedicalHistory.drugAllergiesNameLabel', 'Nom du / des medicaments')}
            </span>
            <div className="mt-2 space-y-2">
              {allergyFields.map((field, index) => (
                <div className="flex items-center gap-2" key={field.id}>
                  <input
                    className="h-12 flex-1 rounded-lg border border-[#bccac1] bg-white px-4 text-sm outline-none transition focus:border-[#008560] focus:ring-2 focus:ring-[#008560]"
                    placeholder={t('symptomForm.stepMedicalHistory.drugAllergyPlaceholder', 'Ex: Penicilline')}
                    type="text"
                    {...register(`drugAllergies.${index}.value`)}
                  />
                  <button
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#ffdad6] bg-[#ffdad6] text-[#93000a] transition hover:bg-[#ffb4ab]"
                    type="button"
                    onClick={() => removeAllergy(index)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-dashed border-[#bccac1] px-4 py-2 text-sm text-[#3d4943] transition hover:bg-[#eff5ef]"
              type="button"
              onClick={() => appendAllergy({ value: '' })}
            >
              <Plus size={15} />
              {t('symptomForm.stepMedicalHistory.addAllergyButton', 'Ajouter une allergie')}
            </button>
            <FieldError message={errors.drugAllergies?.message} />
          </div>
        )}
      </div>

      <div className="mt-8">
        <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">
          {t('symptomForm.stepMedicalHistory.familyHistoryLabel', 'Antécédents familiaux')}
        </label>
        <TagGroup
          name="familyHistory"
          optionLabels={familyHistoryLabels}
          options={familyHistoryOptions}
          register={register}
          selected={values.familyHistory}
          setValue={setValue}
          t={t}
        />
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {habitRows.map(([label, name, quantityName, placeholder]) => (
          <div key={name}>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">
              {label} <span className="text-[#ba1a1a]">*</span>
            </span>
            <div className="mt-2 flex gap-2">
              {['Oui', 'Non'].map((option) => (
                <label
                  className="cursor-pointer rounded-full border border-[#bccac1] bg-[#f5fbf5] px-4 py-2 text-sm text-[#3d4943] transition has-[:checked]:border-[#008560] has-[:checked]:bg-[#008560]/10 has-[:checked]:font-semibold has-[:checked]:text-[#008560]"
                  key={option}
                >
                  <input className="sr-only" type="radio" value={option} {...register(name)} />
                  {yesNoLabels[option]}
                </label>
              ))}
            </div>
            <FieldError message={errors[name]?.message} />
            {values[name] === 'Oui' && (
              <>
                <input
                  className="mt-3 h-11 w-full rounded-lg border border-[#bccac1] bg-white px-4 text-sm outline-none transition focus:border-[#008560] focus:ring-2 focus:ring-[#008560]"
                  placeholder={placeholder}
                  type="text"
                  {...register(quantityName)}
                />
                <FieldError message={errors[quantityName]?.message} />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
