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

export function StepPersonalInfo({ errors, register }) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Age</span>
        <input
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
          inputMode="numeric"
          placeholder="29"
          type="number"
          {...register('age')}
        />
        <FieldError message={errors.age?.message} />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Gender</span>
        <select
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
          {...register('gender')}
        >
          <option value="">Select gender</option>
          <option value="Female">Female</option>
          <option value="Male">Male</option>
          <option value="Other">Other</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>
        <FieldError message={errors.gender?.message} />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Weight</span>
        <input
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
          inputMode="decimal"
          placeholder="68 kg"
          type="number"
          {...register('weight')}
        />
        <FieldError message={errors.weight?.message} />
      </label>
    </div>
  )
}
