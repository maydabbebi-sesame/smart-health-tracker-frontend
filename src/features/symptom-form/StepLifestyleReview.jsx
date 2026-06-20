import { AlertCircle, BrainCircuit, CheckCircle2 } from 'lucide-react'

import { useTranslation } from '../../i18n/useTranslation'
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

function RadioGroup({ name, options, optionLabels, register }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <label
          className="cursor-pointer rounded-full border border-[#bccac1] bg-[#f5fbf5] px-4 py-2 text-sm text-[#3d4943] transition has-[:checked]:border-[#008560] has-[:checked]:bg-[#008560]/10 has-[:checked]:font-semibold has-[:checked]:text-[#008560]"
          key={option}
        >
          <input className="sr-only" type="radio" value={option} {...register(name)} />
          {optionLabels?.[option] ?? option}
        </label>
      ))}
    </div>
  )
}

function CheckboxGroup({ name, options, optionLabels, register, selected = [] }) {
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
          {optionLabels?.[option] ?? option}
        </label>
      ))}
    </div>
  )
}

export function StepLifestyleReview({ errors, register, values }) {
  const { t } = useTranslation()
  const imc =
    values.weight && values.height ? (Number(values.weight) / (Number(values.height) / 100) ** 2).toFixed(1) : 'N/A'

  const activityLabels = {
    Sedentaire: t('symptomForm.stepLifestyleReview.activityOption.sedentary', 'Sedentaire'),
    Legere: t('symptomForm.stepLifestyleReview.activityOption.light', 'Legere'),
    Moderee: t('symptomForm.stepLifestyleReview.activityOption.moderate', 'Moderee'),
    Intense: t('symptomForm.stepLifestyleReview.activityOption.intense', 'Intense'),
  }

  const dietLabels = {
    Omnivore: t('symptomForm.stepLifestyleReview.dietOption.omnivore', 'Omnivore'),
    Vegetarien: t('symptomForm.stepLifestyleReview.dietOption.vegetarian', 'Vegetarien'),
    Vegan: t('symptomForm.stepLifestyleReview.dietOption.vegan', 'Vegan'),
    'Sans gluten': t('symptomForm.stepLifestyleReview.dietOption.glutenFree', 'Sans gluten'),
    Diabetique: t('symptomForm.stepLifestyleReview.dietOption.diabetic', 'Diabetique'),
  }

  const sleepLabels = {
    'Tres bon': t('symptomForm.stepLifestyleReview.sleepOption.veryGood', 'Tres bon'),
    Bon: t('symptomForm.stepLifestyleReview.sleepOption.good', 'Bon'),
    Mauvais: t('symptomForm.stepLifestyleReview.sleepOption.bad', 'Mauvais'),
    Insomnie: t('symptomForm.stepLifestyleReview.sleepOption.insomnia', 'Insomnie'),
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-[22px] font-bold leading-tight text-[#171d1a] dark:text-white">
          {t('symptomForm.stepLifestyleReview.title', 'Mode de vie & revision')}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#3d4943]">
          {t(
            'symptomForm.stepLifestyleReview.subtitle',
            'Habitudes quotidiennes et validation finale avant la simulation de soumission IA.',
          )}
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">
            {t('symptomForm.stepLifestyleReview.physicalActivityLabel', 'Activite physique')}
          </label>
          <RadioGroup name="physicalActivity" optionLabels={activityLabels} options={activityOptions} register={register} />
        </div>

        <div>
          <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">
            {t('symptomForm.stepLifestyleReview.dietLabel', 'Alimentation')}
          </label>
          <CheckboxGroup name="diet" optionLabels={dietLabels} options={dietOptions} register={register} selected={values.diet} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">
              {t('symptomForm.stepLifestyleReview.sleepQualityLabel', 'Qualite du sommeil')}
            </label>
            <RadioGroup name="sleepQuality" optionLabels={sleepLabels} options={sleepOptions} register={register} />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">
                {t('symptomForm.stepLifestyleReview.stressLevelLabel', 'Niveau de stress')}
              </span>
              <span className="font-metric text-lg font-semibold text-[#00694c]">{values.stressLevel || 1}/5</span>
            </div>
            <input className="mt-3 w-full accent-[#00694c]" max="5" min="1" type="range" {...register('stressLevel')} />
          </div>
        </div>

        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#171d1a]">
            {t('symptomForm.stepLifestyleReview.mediassistQuestionLabel', 'Votre question pour MediAssist (optionnel)')}
          </span>
          <textarea
            className="mt-2 min-h-28 w-full resize-y rounded-lg border border-[#bccac1] bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#008560] focus:ring-2 focus:ring-[#008560]"
            maxLength={600}
            placeholder={t(
              'symptomForm.stepLifestyleReview.mediassistQuestionPlaceholder',
              "Ex. : Que puis-je faire pour mieux dormir cette semaine ? Posez ici la question que vous voulez soumettre à l'assistant IA, sinon il analysera vos données automatiquement.",
            )}
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
            <h3 className="font-semibold text-[#171d1a] dark:text-white">
              {t('symptomForm.stepLifestyleReview.aiPayloadSummaryTitle', 'Resume payload IA')}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#3d4943]">
              {t(
                'symptomForm.stepLifestyleReview.aiPayloadSummaryText',
                'Patient : {{age}} ans, {{sex}}, {{weight}} kg, {{height}} cm (IMC : {{imc}}). Symptomes : {{symptoms}}.',
                {
                  age: values.age || '--',
                  sex: values.biologicalSex || '--',
                  weight: values.weight || '--',
                  height: values.height || '--',
                  imc,
                  symptoms: values.symptoms?.join(', ') || '--',
                },
              )}
            </p>
          </div>
        </div>
      </div>

      <label className="mt-5 flex items-start gap-3 rounded-xl border border-[#dee4de] bg-[#f5fbf5] p-4">
        <input className="mt-1 h-5 w-5 accent-[#00694c]" type="checkbox" {...register('consent')} />
        <span>
          <span className="block text-sm font-semibold text-[#171d1a] dark:text-white">
            {t('symptomForm.stepLifestyleReview.aiConsentTitle', 'Consentement IA')}
          </span>
          <span className="mt-1 block text-sm leading-6 text-[#3d4943]">
            {t(
              'symptomForm.stepLifestyleReview.aiConsentText',
              'Je comprends que cette démo frontend utilise une réponse IA simulée et ne remplace pas un avis médical.',
            )}
          </span>
          <FieldError message={errors.consent?.message} />
        </span>
      </label>
    </div>
  )
}
