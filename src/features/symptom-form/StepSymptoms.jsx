import { AlertCircle, Check } from 'lucide-react'

import { symptoms } from './mock/symptoms'

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

export function StepSymptoms({ errors, register, selectedSymptoms = [] }) {
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {symptoms.map((symptom) => {
          const isSelected = selectedSymptoms.includes(symptom)

          return (
            <label
              className={`relative flex min-h-24 cursor-pointer flex-col justify-between rounded-xl border p-4 transition ${
                isSelected
                  ? 'border-teal-500 bg-teal-50 shadow-sm shadow-teal-900/10'
                  : 'border-slate-200 bg-white hover:border-cyan-300 hover:bg-cyan-50'
              }`}
              key={symptom}
            >
              <input className="sr-only" type="checkbox" value={symptom} {...register('symptoms')} />
              <span className="text-sm font-semibold text-slate-900">{symptom}</span>
              <span
                className={`mt-4 grid h-7 w-7 place-items-center rounded-full border ${
                  isSelected ? 'border-teal-500 bg-teal-600 text-white' : 'border-slate-200 bg-white text-white'
                }`}
              >
                <Check size={16} />
              </span>
            </label>
          )
        })}
      </div>
      <FieldError message={errors.symptoms?.message} />
    </div>
  )
}
