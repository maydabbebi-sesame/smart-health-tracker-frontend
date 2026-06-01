import { AlertCircle, BrainCircuit, CheckCircle2 } from 'lucide-react'

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

export function StepReview({ errors, register, values }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-950">Review details</h3>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-slate-500">Age</dt>
              <dd className="mt-1 text-slate-900">{values.age || 'Not provided'}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Gender</dt>
              <dd className="mt-1 text-slate-900">{values.gender || 'Not selected'}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Weight</dt>
              <dd className="mt-1 text-slate-900">{values.weight ? `${values.weight} kg` : 'Not provided'}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Symptoms</dt>
              <dd className="mt-1 text-slate-900">{values.symptoms?.join(', ') || 'Not selected'}</dd>
            </div>
          </dl>
          <div className="mt-4 rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-500">Description</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{values.description || 'No description added'}</p>
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <input className="mt-1 h-5 w-5 accent-teal-600" type="checkbox" {...register('consent')} />
          <span>
            <span className="block text-sm font-semibold text-slate-900">AI analysis consent</span>
            <span className="mt-1 block text-sm leading-6 text-slate-600">
              I understand this frontend demo uses a fake AI response and does not provide medical advice.
            </span>
            <FieldError message={errors.consent?.message} />
          </span>
        </label>
      </div>

      <aside className="rounded-xl border border-teal-200 bg-teal-50 p-5">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-teal-600 text-white">
          <BrainCircuit size={22} />
        </div>
        <h3 className="mt-4 font-semibold text-slate-950">Ready for analysis</h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          The demo will simulate a secure submission and return a mocked AI analysis response.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/70 p-3 text-sm font-medium text-teal-800">
          <CheckCircle2 size={18} />
          Frontend-only MVP flow
        </div>
      </aside>
    </div>
  )
}
