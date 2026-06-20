import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Mail, UserRound } from 'lucide-react'

import { register } from '../features/auth/auth'
import { useTranslation } from '../i18n/useTranslation'

function RegisterPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
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
      navigate('/verify-email', {
        replace: true,
        state: {
          uid: result.data.uid,
          email,
          verificationCode: result.data.verificationCode,
          devNote: result.data.devNote,
        },
      })
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h2 className="text-[32px] font-semibold leading-tight text-[#171d1a]">{t('register.title', 'Créer un compte')}</h2>
        <p className="mt-2 text-sm leading-6 text-[#3d4943]">
          {t('register.subtitle', 'Démarrez avec un compte démo sécurisé pour explorer le tableau de bord.')}
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="ml-1 text-xs font-semibold uppercase tracking-wide text-[#3d4943]">
            {t('register.nameLabel', 'Nom complet')}
          </span>
          <div className="relative mt-2">
            <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7a73]" size={17} />
            <input
              className="w-full rounded-lg border border-[#bccac1] bg-[#eff5ef] py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]"
              defaultValue=""
              name="name"
              required
              type="text"
            />
          </div>
        </label>

        <label className="block">
          <span className="ml-1 text-xs font-semibold uppercase tracking-wide text-[#3d4943]">
            {t('register.emailLabel', 'Adresse e-mail')}
          </span>
          <div className="relative mt-2">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7a73]" size={17} />
            <input
              className="w-full rounded-lg border border-[#bccac1] bg-[#eff5ef] py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]"
              defaultValue=""
              name="email"
              required
              type="email"
            />
          </div>
        </label>

        <label className="block">
          <span className="ml-1 text-xs font-semibold uppercase tracking-wide text-[#3d4943]">
            {t('register.passwordLabel', 'Mot de passe')}
          </span>
          <div className="relative mt-2">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7a73]" size={17} />
            <input
              className="w-full rounded-lg border border-[#bccac1] bg-[#eff5ef] py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]"
              defaultValue="password"
              minLength={6}
              name="password"
              required
              type="password"
            />
          </div>
        </label>

        {error ? (
          <p className="rounded-lg border border-[#ffdad6] bg-[#fff5f4] px-3 py-2 text-sm text-[#7e2a27]">{error}</p>
        ) : null}

        <button
          className="w-full rounded-lg bg-[#00694c] px-4 py-3 text-sm font-bold text-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition hover:bg-[#008560] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? t('register.submitting', 'Création du compte...') : t('register.submit', 'Créer mon compte')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#3d4943]">
        {t('register.alreadyRegistered', 'Déjà inscrit ?')}{' '}
        <Link className="font-semibold text-[#00694c] hover:text-[#008560]" to="/login">
          {t('register.login', 'Se connecter')}
        </Link>
      </p>
    </div>
  )
}

export default RegisterPage
