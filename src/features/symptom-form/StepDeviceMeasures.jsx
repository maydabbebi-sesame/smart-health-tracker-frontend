import { AlertCircle } from 'lucide-react'

import { useTranslation } from '../../i18n/useTranslation'

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

// ── IMC (mirrors mediassist_service/prompt_builder.py's calc_imc, so the
// indicator the patient sees here matches what MediAssist reasons about) ────
function calcImc(weight, height, t) {
  const w = Number(weight)
  const h = Number(height)
  if (!w || !h) {
    return { value: 'N/R', category: t('symptomForm.stepDeviceMeasures.imcMissing', 'Renseignez le poids et la taille') }
  }

  const v = w / (h / 100) ** 2
  let category
  if (v < 18.5) category = t('symptomForm.stepDeviceMeasures.imcUnderweight', 'Insuffisance pondérale')
  else if (v < 25) category = t('symptomForm.stepDeviceMeasures.imcNormal', 'Poids normal')
  else if (v < 30) category = t('symptomForm.stepDeviceMeasures.imcOverweight', 'Surpoids')
  else if (v < 35) category = t('symptomForm.stepDeviceMeasures.imcObeseI', 'Obésité classe I')
  else if (v < 40) category = t('symptomForm.stepDeviceMeasures.imcObeseII', 'Obésité classe II')
  else category = t('symptomForm.stepDeviceMeasures.imcObeseIII', 'Obésité classe III')

  return { value: v.toFixed(1), category }
}

function NumberField({ error, label, name, placeholder, register, step = '1' }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-[#171d1a]">{label}</span>
      <input
        className="mt-2 h-12 w-full rounded-lg border border-[#bccac1] bg-white px-4 text-sm outline-none transition focus:border-[#008560] focus:ring-2 focus:ring-[#008560]"
        inputMode="decimal"
        placeholder={placeholder}
        step={step}
        type="number"
        {...register(name)}
      />
      <FieldError message={error?.message} />
    </label>
  )
}

export function StepDeviceMeasures({ errors, register, values }) {
  const { t } = useTranslation()
  const hasDiabetes = values.chronicDiseases?.some((disease) => disease.toLowerCase().includes('diabete'))
  const imc = calcImc(values.weight, values.height, t)
  const variation = values.weightVariation
  const showVariationKg = variation === 'Prise' || variation === 'Perte'
  const weightVariationLabels = {
    Prise: t('symptomForm.stepDeviceMeasures.weightVariationOption.gain', 'Prise'),
    Perte: t('symptomForm.stepDeviceMeasures.weightVariationOption.loss', 'Perte'),
    Stable: t('symptomForm.stepDeviceMeasures.weightVariationOption.stable', 'Stable'),
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-[22px] font-bold leading-tight text-[#171d1a] dark:text-white">
          {t('symptomForm.stepDeviceMeasures.title', 'Mesures appareils')}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#3d4943]">
          {t(
            'symptomForm.stepDeviceMeasures.subtitle',
            'Donnees optionnelles mesurees a domicile avec tensiometre, oxymetre, thermometre, glucometre ou balance.',
          )}
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-[#d2e4ff] bg-[#eff5ef] p-4 text-sm leading-6 text-[#3d4943]">
        {t(
          'symptomForm.stepDeviceMeasures.disclaimer',
          "Renseignez ces champs uniquement si vous disposez d'un materiel de mesure fiable et d'une valeur recente. Ne saisissez pas de valeurs aleatoires : les champs peuvent rester vides si vous n'avez pas l'appareil.",
        )}
      </div>

      <div className="mb-6 flex items-center justify-between rounded-xl border border-[#bccac1] bg-[#f5fbf5] p-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-[#171d1a]">
            {t('symptomForm.stepDeviceMeasures.imcLabel', 'Indice de masse corporelle (IMC)')}
          </span>
          <p className="mt-1 text-sm text-[#3d4943]">{imc.category}</p>
        </div>
        <span className="font-metric text-2xl font-semibold text-[#00694c]">{imc.value}</span>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <NumberField
          error={errors.bloodPressureSys}
          label={t('symptomForm.stepDeviceMeasures.bloodPressureSysLabel', 'Tension systolique')}
          name="bloodPressureSys"
          placeholder={t('symptomForm.stepDeviceMeasures.bloodPressureSysPlaceholder', 'Ex: 120')}
          register={register}
        />
        <NumberField
          error={errors.bloodPressureDia}
          label={t('symptomForm.stepDeviceMeasures.bloodPressureDiaLabel', 'Tension diastolique')}
          name="bloodPressureDia"
          placeholder={t('symptomForm.stepDeviceMeasures.bloodPressureDiaPlaceholder', 'Ex: 80')}
          register={register}
        />
        <NumberField
          error={errors.heartRate}
          label={t('symptomForm.stepDeviceMeasures.heartRateLabel', 'Fréquence cardiaque')}
          name="heartRate"
          placeholder={t('symptomForm.stepDeviceMeasures.heartRatePlaceholder', 'bpm')}
          register={register}
        />
        <NumberField
          error={errors.spo2}
          label={t('symptomForm.stepDeviceMeasures.spo2Label', 'Saturation O2')}
          name="spo2"
          placeholder={t('symptomForm.stepDeviceMeasures.spo2Placeholder', '%')}
          register={register}
        />
        <NumberField
          error={errors.temperature}
          label={t('symptomForm.stepDeviceMeasures.temperatureLabel', 'Temperature corporelle')}
          name="temperature"
          placeholder={t('symptomForm.stepDeviceMeasures.temperaturePlaceholder', 'Ex: 37.4')}
          register={register}
          step="0.1"
        />
        {hasDiabetes && (
          <NumberField
            error={errors.glycemia}
            label={t('symptomForm.stepDeviceMeasures.glycemiaLabel', 'Glycemie capillaire')}
            name="glycemia"
            placeholder={t('symptomForm.stepDeviceMeasures.glycemiaPlaceholder', 'g/L')}
            register={register}
            step="0.01"
          />
        )}
      </div>

      <div className="mt-6">
        <span className="text-xs font-semibold uppercase tracking-wide text-[#171d1a]">
          {t('symptomForm.stepDeviceMeasures.weightVariationLabel', 'Variation de poids sur 1 mois')}
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {['Prise', 'Perte', 'Stable'].map((option) => (
            <label
              className="cursor-pointer rounded-full border border-[#bccac1] bg-[#f5fbf5] px-4 py-2 text-sm text-[#3d4943] transition has-[:checked]:border-[#008560] has-[:checked]:bg-[#008560]/10 has-[:checked]:font-semibold has-[:checked]:text-[#008560]"
              key={option}
            >
              <input className="sr-only" type="radio" value={option} {...register('weightVariation')} />
              {weightVariationLabels[option]}
            </label>
          ))}
        </div>
        {showVariationKg && (
          <div className="mt-3 max-w-[220px]">
            <NumberField
              error={errors.weightVariationKg}
              label={t(
                'symptomForm.stepDeviceMeasures.weightVariationKgLabel',
                'Quantité {{kind}} (kg)',
                { kind: variation === 'Prise' ? t('symptomForm.stepDeviceMeasures.weightVariationKgGained', 'prise') : t('symptomForm.stepDeviceMeasures.weightVariationKgLost', 'perdue') },
              )}
              name="weightVariationKg"
              placeholder={t('symptomForm.stepDeviceMeasures.weightVariationKgPlaceholder', 'Ex: 3')}
              register={register}
              step="0.5"
            />
          </div>
        )}
      </div>
    </div>
  )
}
