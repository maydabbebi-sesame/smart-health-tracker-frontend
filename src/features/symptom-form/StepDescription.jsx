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

export function StepDescription({ description = '', errors, register }) {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold leading-tight text-[#171d1a] dark:text-white">
          Description additionnelle
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#3d4943]">
          Ajoutez le contexte utile : debut, intensite, facteurs declenchants ou elements rassurants.
        </p>
      </div>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-[#3d4943]">Notes libres</span>
        <textarea
          className="mt-2 min-h-44 w-full resize-y rounded-lg border border-[#bccac1] bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#008560] focus:ring-2 focus:ring-[#008560]"
          maxLength={600}
          placeholder="Decrivez le debut des symptomes, ce qui les aggrave ou les soulage, et le contexte utile..."
          {...register('description')}
        />
      </label>
      <div className="mt-2 flex items-start justify-between gap-4">
        <FieldError message={errors.description?.message} />
        <span className="ml-auto text-xs text-slate-500">{description.length}/600</span>
      </div>
    </div>
  )
}
