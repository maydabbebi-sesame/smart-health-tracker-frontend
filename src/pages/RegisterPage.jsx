import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Mail, UserRound } from 'lucide-react'

import { register } from '../features/auth/auth'

function RegisterPage() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const name = formData.get('name')
    const email = formData.get('email')
    const password = formData.get('password')

    const result = await register(name, email, password)

    setLoading(false)

    if (result.success) {
      // Registration successful - redirect to login (user needs to verify email)
      navigate('/login', { replace: true })
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h2 className="text-[32px] font-semibold leading-tight text-[#171d1a]">Creer un compte</h2>
        <p className="mt-2 text-sm leading-6 text-[#3d4943]">
          Demarrez avec un compte demo securise pour explorer le tableau de bord.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="ml-1 text-xs font-semibold uppercase tracking-wide text-[#3d4943]">Nom complet</span>
          <div className="relative mt-2">
            <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7a73]" size={17} />
            <input
              className="w-full rounded-lg border border-[#bccac1] bg-[#eff5ef] py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]"
              defaultValue="Maya Ben Ali"
              name="name"
              type="text"
            />
          </div>
        </label>

        <label className="block">
          <span className="ml-1 text-xs font-semibold uppercase tracking-wide text-[#3d4943]">Adresse e-mail</span>
          <div className="relative mt-2">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7a73]" size={17} />
            <input
              className="w-full rounded-lg border border-[#bccac1] bg-[#eff5ef] py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]"
              defaultValue="maya@smarthealth.local"
              name="email"
              type="email"
            />
          </div>
        </label>

        <label className="block">
          <span className="ml-1 text-xs font-semibold uppercase tracking-wide text-[#3d4943]">Mot de passe</span>
          <div className="relative mt-2">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7a73]" size={17} />
            <input
              className="w-full rounded-lg border border-[#bccac1] bg-[#eff5ef] py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]"
              defaultValue="password"
              name="password"
              type="password"
            />
          </div>
        </label>

        <button
          className="w-full rounded-lg bg-[#00694c] px-4 py-3 text-sm font-bold text-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition hover:bg-[#008560]"
          type="submit"
        >
          Creer mon compte
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#3d4943]">
        Deja inscrit ?{' '}
        <Link className="font-semibold text-[#00694c] hover:text-[#008560]" to="/login">
          Se connecter
        </Link>
      </p>
    </div>
  )
}

export default RegisterPage
