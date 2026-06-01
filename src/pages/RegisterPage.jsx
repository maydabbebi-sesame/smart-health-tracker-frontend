import { Link, useNavigate } from 'react-router-dom'

import { loginWithFakeJwt } from '../features/auth/auth'

function RegisterPage() {
  const navigate = useNavigate()

  function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    loginWithFakeJwt({
      email: formData.get('email'),
      name: formData.get('name'),
    })

    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-950">Create account</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Start with a demo JWT and protected dashboard access.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Full name</span>
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            defaultValue="Maya Ben Ali"
            name="name"
            type="text"
          />
        </label>

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
          Create account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already registered?{' '}
        <Link className="font-semibold text-teal-700 hover:text-teal-800" to="/login">
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default RegisterPage
