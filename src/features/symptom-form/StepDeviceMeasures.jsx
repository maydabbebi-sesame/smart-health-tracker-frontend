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
  const hasDiabetes = values.chronicDiseases?.some((disease) => disease.toLowerCase().includes('diabete'))

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-[22px] font-bold leading-tight text-[#171d1a] dark:text-white">Mesures appareils</h2>
        <p className="mt-2 text-sm leading-6 text-[#3d4943]">
          Donnees optionnelles mesurees a domicile avec tensiometre, oxymetre, thermometre, glucometre ou balance.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <NumberField error={errors.bloodPressureSys} label="Tension systolique" name="bloodPressureSys" placeholder="Ex: 120" register={register} />
        <NumberField error={errors.bloodPressureDia} label="Tension diastolique" name="bloodPressureDia" placeholder="Ex: 80" register={register} />
        <NumberField error={errors.heartRate} label="Frequence cardiaque" name="heartRate" placeholder="bpm" register={register} />
        <NumberField error={errors.spo2} label="Saturation O2" name="spo2" placeholder="%" register={register} />
        <NumberField error={errors.temperature} label="Temperature corporelle" name="temperature" placeholder="Ex: 37.4" register={register} step="0.1" />
        {hasDiabetes && (
          <NumberField error={errors.glycemia} label="Glycemie capillaire" name="glycemia" placeholder="g/L" register={register} step="0.01" />
        )}
      </div>

      <div className="mt-6">
        <span className="text-xs font-semibold uppercase tracking-wide text-[#171d1a]">Variation de poids sur 1 mois</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {['Prise', 'Perte', 'Stable'].map((option) => (
            <label
              className="cursor-pointer rounded-full border border-[#bccac1] bg-[#f5fbf5] px-4 py-2 text-sm text-[#3d4943] transition has-[:checked]:border-[#008560] has-[:checked]:bg-[#008560]/10 has-[:checked]:font-semibold has-[:checked]:text-[#008560]"
              key={option}
            >
              <input className="sr-only" type="radio" value={option} {...register('weightVariation')} />
              {option}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
