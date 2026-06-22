import { ArrowLeft, CheckCircle2, Mail, RefreshCw, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { resendVerificationCode, verifyEmail } from '../features/auth/auth'

const SESSION_KEY = 'smart_health_verification'
const CODE_LENGTH = 6

function readVerificationSession(locationState) {
  if (locationState?.uid && locationState?.email) {
    return locationState
  }

  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || {}
  } catch {
    return {}
  }
}

function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = readVerificationSession(location.state)
  const [uid] = useState(session.uid || '')
  const [email] = useState(session.email || '')
  const [digits, setDigits] = useState(() => {
    const initialCode = String(session.verificationCode || '').slice(0, CODE_LENGTH)
    return Array.from({ length: CODE_LENGTH }, (_, index) => initialCode[index] || '')
  })
  const [devCode, setDevCode] = useState(session.verificationCode || '')
  const [devNote, setDevNote] = useState(session.devNote || '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendSeconds, setResendSeconds] = useState(0)
  const inputRefs = useRef([])

  const code = digits.join('')
  const hasValidSession = Boolean(uid && email)

  useEffect(() => {
    if (resendSeconds <= 0) return undefined
    const timer = window.setInterval(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendSeconds])

  function persistSession(nextValues = {}) {
    const nextSession = {
      uid,
      email,
      verificationCode: nextValues.verificationCode ?? devCode,
      devNote: nextValues.devNote ?? devNote,
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
  }

  function updateDigit(index, value) {
    const digit = value.replace(/\D/g, '').slice(-1)
    setDigits((current) => {
      const next = [...current]
      next[index] = digit
      return next
    })
    setError('')

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index, event) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handlePaste(event) {
    const pastedCode = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
    if (!pastedCode) return
    event.preventDefault()
    setDigits(Array.from({ length: CODE_LENGTH }, (_, index) => pastedCode[index] || ''))
    inputRefs.current[Math.min(pastedCode.length, CODE_LENGTH) - 1]?.focus()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!hasValidSession) {
      setError('Session de verification invalide. Veuillez recommencer l inscription.')
      return
    }
    if (code.length !== CODE_LENGTH) {
      setError('Saisissez les 6 chiffres du code de verification.')
      return
    }

    setLoading(true)
    const result = await verifyEmail(uid, code)
    setLoading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    sessionStorage.removeItem(SESSION_KEY)
    setSuccess('Votre adresse e-mail est verifiee. Redirection vers la connexion...')
    window.setTimeout(() => {
      navigate('/login', {
        replace: true,
        state: { message: 'Email verifie. Vous pouvez maintenant vous connecter.' },
      })
    }, 1200)
  }

  async function handleResend() {
    if (!email || resendSeconds > 0) return

    setError('')
    setSuccess('')
    setLoading(true)
    const result = await resendVerificationCode(email)
    setLoading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    const nextCode = result.data?.verificationCode || ''
    const nextNote = result.data?.devNote || ''
    setDevCode(nextCode)
    setDevNote(nextNote)
    setDigits(Array.from({ length: CODE_LENGTH }, (_, index) => nextCode[index] || ''))
    persistSession({ verificationCode: nextCode, devNote: nextNote })
    setResendSeconds(60)
    setSuccess('Un nouveau code de verification a ete envoye.')
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-[#00694c] text-white">
          <ShieldCheck size={24} />
        </div>
        <h2 className="text-[32px] font-semibold leading-tight text-[#171d1a]">Verifier votre e-mail</h2>
        <p className="mt-2 text-sm leading-6 text-[#3d4943]">
          {email
            ? <>Nous avons envoye un code a <strong>{email}</strong>. Saisissez-le pour activer votre compte.</>
            : 'Votre session a expire. Revenez a l inscription pour recevoir un nouveau code.'}
        </p>
      </div>

      {devCode && (
        <div className="mb-5 rounded-lg border border-[#d2e4ff] bg-[#eff5ef] p-4 text-sm text-[#3d4943]">
          <p className="font-semibold text-[#171d1a]">Mode developpement</p>
          <p className="mt-1">{devNote || 'SMTP non configure : utilisez temporairement ce code local.'}</p>
          <p className="mt-2 font-mono text-xl font-bold tracking-[0.35em] text-[#00694c]">{devCode}</p>
        </div>
      )}

      {hasValidSession ? (
        <>
          <form onSubmit={handleSubmit}>
            <fieldset disabled={loading || Boolean(success)}>
              <legend className="text-xs font-semibold uppercase text-[#3d4943]">Code de verification</legend>
              <div className="mt-3 grid grid-cols-6 gap-2" onPaste={handlePaste}>
                {digits.map((digit, index) => (
                  <input
                    aria-label={`Chiffre ${index + 1} du code`}
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    className="aspect-square min-w-0 rounded-lg border border-[#bccac1] bg-[#eff5ef] text-center text-xl font-bold text-[#171d1a] outline-none transition focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]"
                    inputMode="numeric"
                    key={index}
                    maxLength={1}
                    ref={(element) => { inputRefs.current[index] = element }}
                    value={digit}
                    onChange={(event) => updateDigit(index, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                  />
                ))}
              </div>
            </fieldset>

            {error && (
              <p className="mt-4 rounded-lg border border-[#ffdad6] bg-[#fff5f4] px-3 py-2 text-sm text-[#7e2a27]">
                {error}
              </p>
            )}
            {success && (
              <p className="mt-4 flex items-center gap-2 rounded-lg border border-[#68dbae] bg-[#eff5ef] px-3 py-2 text-sm text-[#00513a]">
                <CheckCircle2 size={17} />
                {success}
              </p>
            )}

            <button
              className="mt-5 w-full rounded-lg bg-[#00694c] px-4 py-3 text-sm font-bold text-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition hover:bg-[#008560] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading || code.length !== CODE_LENGTH || Boolean(success)}
              type="submit"
            >
              {loading ? 'Verification...' : 'Verifier mon compte'}
            </button>
          </form>

          <button
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#bccac1] bg-white px-4 py-3 text-sm font-semibold text-[#171d1a] transition hover:border-[#00694c] hover:text-[#00694c] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading || resendSeconds > 0 || Boolean(success)}
            type="button"
            onClick={handleResend}
          >
            <RefreshCw size={17} />
            {resendSeconds > 0 ? `Renvoyer dans ${resendSeconds}s` : 'Renvoyer le code'}
          </button>
        </>
      ) : (
        <Link
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00694c] px-4 py-3 text-sm font-bold text-white"
          to="/register"
        >
          <ArrowLeft size={17} />
          Recommencer l inscription
        </Link>
      )}

      <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs leading-5 text-[#6d7a73]">
        <Mail size={15} />
        Le code expire apres une heure.
      </p>
    </div>
  )
}

export default VerifyEmailPage
