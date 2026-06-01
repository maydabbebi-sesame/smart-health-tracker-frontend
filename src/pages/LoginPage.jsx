import { Activity } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { loginWithFakeJwt } from '../features/auth/auth'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    loginWithFakeJwt({
      email: formData.get('email'),
      role: formData.get('email') === 'admin@smarthealth.local' ? 'admin' : 'patient',
    })

    navigate(from, { replace: true })
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-8">
        <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-teal-600 text-white">
          <Activity size={22} />
        </div>
        <h2 className="text-2xl font-semibold text-slate-950">Welcome back</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Sign in to access your protected healthcare dashboard.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            defaultValue="maya@smarthealth.local"
            name="email"
            type="email"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            defaultValue="password"
            name="password"
            type="password"
          />
        </label>

        <button
          className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
          type="submit"
        >
          Sign in
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        New to Smart Health?{' '}
        <Link className="font-semibold text-teal-700 hover:text-teal-800" to="/register">
          Create an account
        </Link>
      </p>
    </div>
  )
}

export default LoginPage
