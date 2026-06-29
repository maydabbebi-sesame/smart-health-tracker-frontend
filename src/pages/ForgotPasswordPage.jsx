import { ArrowLeft, CheckCircle2, KeyRound, Lock, Mail, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { forgotPassword, resetPassword } from '../features/auth/auth'

const CODE_LENGTH = 6

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('request')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [devNote, setDevNote] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendResetCode(requestedEmail) {
    setError('')
    setMessage('')
    setLoading(true)
    const result = await forgotPassword(requestedEmail)
    setLoading(false)

    if (!result.success) {
      setError(result.error)
      return null
    }

    setMessage(result.message || 'Si cette adresse existe, un code de récupération a été envoyé.')
    setCode(result.data?.verificationCode || '')
    setDevNote(result.data?.devNote || '')
    return result
  }

  async function handleRequestCode(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const requestedEmail = String(formData.get('email') || '').trim().toLowerCase()

    if (!requestedEmail) {
      setError('Saisissez votre adresse e-mail.')
      return
    }

    const result = await sendResetCode(requestedEmail)
    if (result) {
      setEmail(requestedEmail)
      setStep('reset')
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    const formData = new FormData(event.currentTarget)
    const resetCode = code.trim()
    const newPassword = String(formData.get('newPassword') || '')
    const confirmPassword = String(formData.get('confirmPassword') || '')

    if (!new RegExp(`^\\d{${CODE_LENGTH}}$`).test(resetCode)) {
      setError('Le code doit contenir exactement 6 chiffres.')
      return
    }
    if (newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    const result = await resetPassword(email, resetCode, newPassword)
    setLoading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    navigate('/login', {
      replace: true,
      state: { message: 'Mot de passe réinitialisé. Vous pouvez maintenant vous connecter.' },
    })
  }

  async function handleResend() {
    const result = await sendResetCode(email)
    if (result) {
      setMessage('Un nouveau code de récupération a été envoyé.')
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-[#00694c] text-white">
          <KeyRound size={24} />
        </div>
        <h2 className="text-[32px] font-semibold leading-tight text-[#171d1a]">
          {step === 'request' ? 'Mot de passe oublié' : 'Créer un nouveau mot de passe'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#3d4943]">
          {step === 'request'
            ? 'Indiquez votre adresse e-mail pour recevoir un code de récupération.'
            : <>Saisissez le code à 6 chiffres envoyé à <strong>{email}</strong>.</>}
        </p>
      </div>

      {step === 'request' ? (
        <form className="space-y-4" onSubmit={handleRequestCode}>
          <label className="block">
            <span className="ml-1 text-xs font-semibold uppercase tracking-wide text-[#3d4943]">
              Adresse e-mail
            </span>
            <div className="relative mt-2">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7a73]" size={17} />
              <input
                autoComplete="email"
                className="w-full rounded-lg border border-[#bccac1] bg-[#eff5ef] py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]"
                name="email"
                required
                type="email"
              />
            </div>
          </label>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <button
            className="w-full rounded-lg bg-[#00694c] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#008560] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Envoi du code...' : 'Recevoir le code'}
          </button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={handleResetPassword}>
          {message && (
            <p className="flex items-start gap-2 rounded-lg border border-[#68dbae] bg-[#eff5ef] px-3 py-2 text-sm text-[#00513a]">
              <CheckCircle2 className="mt-0.5 shrink-0" size={17} />
              {message}
            </p>
          )}

          {code && devNote && (
            <div className="rounded-lg border border-[#d2e4ff] bg-[#eff5ef] p-4 text-sm text-[#3d4943]">
              <p className="font-semibold text-[#171d1a]">Mode développement</p>
              <p className="mt-1">{devNote}</p>
              <p className="mt-2 font-mono text-xl font-bold tracking-[0.35em] text-[#00694c]">{code}</p>
            </div>
          )}

          <label className="block">
            <span className="ml-1 text-xs font-semibold uppercase tracking-wide text-[#3d4943]">
              Code de récupération
            </span>
            <div className="relative mt-2">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7a73]" size={17} />
              <input
                autoComplete="one-time-code"
                className="w-full rounded-lg border border-[#bccac1] bg-[#eff5ef] py-3 pl-10 pr-3 font-mono text-lg tracking-[0.25em] outline-none transition focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]"
                inputMode="numeric"
                maxLength={CODE_LENGTH}
                name="code"
                pattern="\d{6}"
                required
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH))}
              />
            </div>
          </label>

          <PasswordField label="Nouveau mot de passe" name="newPassword" />
          <PasswordField label="Confirmer le mot de passe" name="confirmPassword" />

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <button
            className="w-full rounded-lg bg-[#00694c] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#008560] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
          </button>

          <button
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#bccac1] bg-white px-4 py-3 text-sm font-semibold text-[#171d1a] transition hover:border-[#00694c] hover:text-[#00694c] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            type="button"
            onClick={handleResend}
          >
            <RefreshCw size={17} />
            Renvoyer le code
          </button>
        </form>
      )}

      <Link
        className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-[#00694c] hover:text-[#008560]"
        to="/login"
      >
        <ArrowLeft size={17} />
        Retour à la connexion
      </Link>
    </div>
  )
}

function PasswordField({ label, name }) {
  return (
    <label className="block">
      <span className="ml-1 text-xs font-semibold uppercase tracking-wide text-[#3d4943]">{label}</span>
      <div className="relative mt-2">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7a73]" size={17} />
        <input
          autoComplete="new-password"
          className="w-full rounded-lg border border-[#bccac1] bg-[#eff5ef] py-3 pl-10 pr-3 text-sm outline-none transition focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]"
          minLength={6}
          name={name}
          required
          type="password"
        />
      </div>
    </label>
  )
}

function ErrorMessage({ children }) {
  return (
    <p className="rounded-lg border border-[#ffdad6] bg-[#fff5f4] px-3 py-2 text-sm text-[#7e2a27]">
      {children}
    </p>
  )
}

export default ForgotPasswordPage
