import { ArrowRight, Eye, Lock, Mail, ShieldPlus } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { login } from '../features/auth/auth'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const result = await login({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    setLoading(false)

    if (result.success) {
      if (result.mfaRequired) {
        // TODO: navigate to MFA verification page
        return
      }
      navigate(from, { replace: true })
    } else {
      setError(result.error)
    }
  }

  function handleSocialLogin(provider) {
    // Social login requires OAuth tokens - placeholder
    setError(`${provider} login requires OAuth integration`)
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-[#00694c] text-white lg:hidden">
          <ShieldPlus size={22} />
        </div>
        <h2 className="text-[32px] font-semibold leading-tight text-[#171d1a]">Connexion</h2>
        <p className="mt-2 text-sm leading-6 text-[#3d4943]">
          Accedez a votre tableau de bord sante securise.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
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
              className="w-full rounded-lg border border-[#bccac1] bg-[#eff5ef] py-3 pl-10 pr-10 text-sm outline-none transition focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]"
              defaultValue="password"
              name="password"
              type="password"
            />
            <button
              aria-label="Afficher le mot de passe"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6d7a73] transition hover:text-[#00694c]"
              type="button"
            >
              <Eye size={17} />
            </button>
          </div>
        </label>

        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="flex items-center gap-2 text-[#3d4943]">
            <input
              className="h-4 w-4 rounded border-[#bccac1] accent-[#00694c]"
              defaultChecked
              type="checkbox"
            />
            Se souvenir de moi
          </label>
          <button className="font-semibold text-[#00694c] hover:text-[#008560]" type="button">
            Mot de passe oublie ?
          </button>
        </div>

        <button
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00694c] px-4 py-3 text-sm font-bold text-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition hover:bg-[#008560]"
          type="submit"
        >
          Se connecter
          <ArrowRight size={17} />
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#dce5df]" />
        <span className="text-xs font-medium text-[#6d7a73]">Ou continuer avec</span>
        <div className="h-px flex-1 bg-[#dce5df]" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {['Google', 'Apple'].map((provider) => (
          <button
            className="flex items-center justify-center gap-2 rounded-lg border border-[#bccac1] bg-white px-4 py-3 text-sm font-semibold text-[#171d1a] shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition hover:border-[#00694c] hover:text-[#00694c]"
            key={provider}
            type="button"
            onClick={() => handleSocialLogin(provider)}
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#eff5ef] text-xs font-bold text-[#00694c]">
              {provider[0]}
            </span>
            {provider}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-[#d2e4ff] bg-[#eff5ef] p-3 text-xs leading-5 text-[#3d4943]">
        Google et Apple sont proposes pour reduire la friction utilisateur et preparer une authentification OAuth
        securisee cote backend. Dans ce MVP, le clic simule une connexion patient.
      </div>

      <p className="mt-6 text-center text-sm text-[#3d4943]">
        Nouveau sur SmartHealth ?{' '}
        <Link className="font-semibold text-[#00694c] hover:text-[#008560]" to="/register">
          Creer un compte
        </Link>
      </p>

      <p className="mt-5 text-center text-xs leading-5 text-[#6d7a73]">
        En vous connectant, vous acceptez les conditions d'utilisation et la politique de confidentialite de Smart
        Health Tracker.
      </p>
    </div>
  )
}

export default LoginPage
