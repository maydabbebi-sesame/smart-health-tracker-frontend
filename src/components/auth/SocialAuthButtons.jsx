import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'

import { loginWithApple, loginWithGoogle } from '../../features/auth/auth'
import { useTranslation } from '../../i18n/useTranslation'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID
const APPLE_REDIRECT_URI = import.meta.env.VITE_APPLE_REDIRECT_URI
const APPLE_SDK_URL = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js'

const BUTTON_CLASSES =
  'flex w-full items-center justify-center gap-2 rounded-lg border border-[#bccac1] bg-white px-4 py-3 text-sm font-semibold text-[#171d1a] shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition hover:border-[#00694c] hover:text-[#00694c] group-hover:border-[#00694c] group-hover:text-[#00694c] disabled:cursor-not-allowed disabled:opacity-60'

let appleSdkPromise = null

function loadAppleSdk() {
  if (window.AppleID) {
    return Promise.resolve(window.AppleID)
  }
  if (!appleSdkPromise) {
    appleSdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = APPLE_SDK_URL
      script.async = true
      script.onload = () => resolve(window.AppleID)
      script.onerror = () => {
        appleSdkPromise = null
        reject(new Error('Failed to load Apple Sign In SDK'))
      }
      document.head.appendChild(script)
    })
  }
  return appleSdkPromise
}

/**
 * Renders "continue with Google/Apple" buttons used by both the login and
 * register pages. Both providers resolve to an OAuth id_token that the
 * backend verifies and uses to find-or-create the user, so the same flow
 * covers signup and login.
 *
 * Google's branded button can't be restyled (FedCM/anti-phishing policy), so
 * to keep the app's original button look we render our own button for the
 * visuals and stack Google's real (invisible) button on top of it - clicks
 * land on Google's button while the user only ever sees ours.
 */
function SocialAuthButtons({ onSuccess, onError }) {
  const { t } = useTranslation()
  const [appleLoading, setAppleLoading] = useState(false)

  async function handleGoogleSuccess(credentialResponse) {
    const idToken = credentialResponse?.credential
    if (!idToken) {
      onError?.(t('login.socialGoogleError', 'Échec de la connexion avec Google'))
      return
    }
    const result = await loginWithGoogle(idToken)
    if (result.success) {
      onSuccess?.(result.user)
    } else {
      onError?.(result.error)
    }
  }

  async function handleAppleClick() {
    if (!APPLE_CLIENT_ID) {
      onError?.(t('login.socialAppleUnavailable', "La connexion Apple n'est pas configurée."))
      return
    }
    setAppleLoading(true)
    try {
      const AppleID = await loadAppleSdk()
      AppleID.auth.init({
        clientId: APPLE_CLIENT_ID,
        scope: 'name email',
        redirectURI: APPLE_REDIRECT_URI || window.location.origin,
        usePopup: true,
      })
      const response = await AppleID.auth.signIn()
      const idToken = response?.authorization?.id_token
      if (!idToken) {
        throw new Error('Missing id_token in Apple response')
      }
      const result = await loginWithApple(idToken)
      if (result.success) {
        onSuccess?.(result.user)
      } else {
        onError?.(result.error)
      }
    } catch (err) {
      if (err?.error !== 'popup_closed_by_user') {
        onError?.(t('login.socialAppleError', 'Échec de la connexion avec Apple'))
      }
    } finally {
      setAppleLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="group relative" title={GOOGLE_CLIENT_ID ? undefined : t('login.socialGoogleUnavailable', "La connexion Google n'est pas configurée.")}>
        <button className={BUTTON_CLASSES} disabled={!GOOGLE_CLIENT_ID} type="button">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[#eff5ef] text-xs font-bold text-[#00694c]">G</span>
          Google
        </button>
        {GOOGLE_CLIENT_ID ? (
          <div className="absolute inset-0 overflow-hidden rounded-lg opacity-0 [&>div]:!h-full [&>div]:!w-full [&_iframe]:!h-full [&_iframe]:!w-full">
            <GoogleLogin onError={() => onError?.(t('login.socialGoogleError', 'Échec de la connexion avec Google'))} onSuccess={handleGoogleSuccess} width="320" />
          </div>
        ) : null}
      </div>

      <button className={BUTTON_CLASSES} disabled={appleLoading} onClick={handleAppleClick} type="button">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-[#eff5ef] text-xs font-bold text-[#00694c]">A</span>
        Apple
      </button>
    </div>
  )
}

export default SocialAuthButtons
