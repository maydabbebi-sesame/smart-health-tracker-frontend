import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Mail, ShieldCheck } from 'lucide-react'

import { resendVerificationCode, verifyEmail } from '../features/auth/auth'
import { useTranslation } from '../i18n/useTranslation'

function VerifyEmailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const uid = location.state?.uid
  const email = location.state?.email
  const [devCode, setDevCode] = useState(location.state?.verificationCode || '')
  const devNote = location.state?.devNote
  const [code, setCode] = useState(location.state?.verificationCode || '')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resent, setResent] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    if (!uid) {
      setError(t('verifyEmail.errors.invalidSession', 'Session invalide. Veuillez vous inscrire a nouveau.'))
      return
    }

    setLoading(true)
    const result = await verifyEmail(uid, code.trim())
    setLoading(false)

    if (result.success) {
      navigate('/login', {
        replace: true,
        state: { message: t('verifyEmail.success.emailVerified', 'Email verifie. Vous pouvez vous connecter.') },
      })
    } else {
      setError(result.error)
    }
  }

  async function handleResend() {
    if (!email) {
      setError(t('verifyEmail.errors.missingEmail', 'Adresse e-mail manquante. Veuillez vous inscrire a nouveau.'))
      return
    }

    setError(null)
    setResent(false)
    setLoading(true)
    const result = await resendVerificationCode(email)
    setLoading(false)

    if (result.success) {
      setResent(true)
      if (result.data?.verificationCode) {
        setDevCode(result.data.verificationCode)
        setCode(result.data.verificationCode)
      }
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-[#00694c] text-white">
          <ShieldCheck size={22} />
        </div>
        <h2 className="text-[32px] font-semibold leading-tight text-[#171d1a]">{t('verifyEmail.title', 'Verifier votre e-mail')}</h2>
        <p className="mt-2 text-sm leading-6 text-[#3d4943]">
          {email
            ? t('verifyEmail.subtitleWithEmail', 'Un code de verification a ete envoye a {{email}}. Saisissez-le ci-dessous pour activer votre compte.', { email })
            : t('verifyEmail.subtitleNoEmail', 'Saisissez le code de verification recu par e-mail pour activer votre compte.')}
        </p>
      </div>

      {devCode ? (
        <div className="mb-4 rounded-lg border border-[#d2e4ff] bg-[#eff5ef] px-3 py-3 text-sm text-[#3d4943]">
          <p className="font-semibold text-[#171d1a]">{t('verifyEmail.devMode.title', 'Mode developpement')}</p>
          <p className="mt-1">
            {devNote || t('verifyEmail.devMode.note', "SMTP n'est pas configure. Utilisez ce code pour verifier votre compte :")}
          </p>
          <p className="mt-2 font-mono text-lg font-bold tracking-widest text-[#00694c]">{devCode}</p>
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="ml-1 text-xs font-semibold uppercase tracking-wide text-[#3d4943]">{t('verifyEmail.form.codeLabel', 'Code de verification')}</span>
          <div className="relative mt-2">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7a73]" size={17} />
            <input
              className="w-full rounded-lg border border-[#bccac1] bg-[#eff5ef] py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]"
              inputMode="numeric"
              maxLength={6}
              name="code"
              onChange={(event) => setCode(event.target.value)}
              placeholder="123456"
              required
              type="text"
              value={code}
            />
          </div>
        </label>

        {error ? (
          <p className="rounded-lg border border-[#ffdad6] bg-[#fff5f4] px-3 py-2 text-sm text-[#7e2a27]">{error}</p>
        ) : null}

        {resent ? (
          <p className="rounded-lg border border-[#d2e4ff] bg-[#eff5ef] px-3 py-2 text-sm text-[#3d4943]">
            {t('verifyEmail.resentNotice', 'Un nouveau code a ete envoye.')}
          </p>
        ) : null}

        <button
          className="w-full rounded-lg bg-[#00694c] px-4 py-3 text-sm font-bold text-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition hover:bg-[#008560] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? t('verifyEmail.form.submitting', 'Verification...') : t('verifyEmail.form.submit', 'Verifier mon e-mail')}
        </button>
      </form>

      <button
        className="mt-4 w-full rounded-lg border border-[#bccac1] bg-white px-4 py-3 text-sm font-semibold text-[#171d1a] transition hover:border-[#00694c] hover:text-[#00694c] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={loading || !email}
        onClick={handleResend}
        type="button"
      >
        {t('verifyEmail.resendButton', 'Renvoyer le code')}
      </button>

      <p className="mt-6 text-center text-sm text-[#3d4943]">
        <Link className="font-semibold text-[#00694c] hover:text-[#008560]" to="/register">
          {t('verifyEmail.backToRegister', "Retour a l'inscription")}
        </Link>
      </p>
    </div>
  )
}

export default VerifyEmailPage
