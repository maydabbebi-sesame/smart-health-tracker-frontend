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
      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Additional description</span>
        <textarea
          className="mt-2 min-h-44 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
          maxLength={600}
          placeholder="Describe when symptoms started, what makes them better or worse, and any relevant context..."
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
