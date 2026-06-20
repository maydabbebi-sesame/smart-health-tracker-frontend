import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  Star,
  Stethoscope,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

import { DoctorDetailModal } from '../features/doctor-agent/DoctorDetailModal'
import { Robot3D } from '../features/doctor-agent/Robot3D'
import { getCurrentUser } from '../services/authService'
import { getDoctorAgentDecision } from '../services/mediAssistService'
import { searchNearbyDoctors } from '../services/doctorsService'
import { getPatientProfile } from '../services/profileService'
import { useMedAssistStore } from '../store/medAssistStore'

// ── Speech bubble — gradient-border glass card ──────────────────────────────
function SpeechBubble({ children, tone = 'default' }) {
  const ring = tone === 'alert'
    ? 'from-[#ff8a80] via-[#ffab91] to-[#ffd54f]'
    : 'from-[#00f0a0] via-[#00b894] to-[#0060a8]'
  return (
    <div className={`rounded-2xl bg-gradient-to-r ${ring} p-[1.5px] shadow-md`}>
      <div className="rounded-2xl bg-white/95 px-5 py-4 text-sm leading-6 text-[#3d4943] backdrop-blur-sm dark:bg-slate-900/90 dark:text-slate-100">
        {children}
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      {[0, 1, 2].map((i) => (
        <motion.span
          animate={{ y: [0, -4, 0] }}
          className="h-1.5 w-1.5 rounded-full bg-[#0060a8]"
          key={i}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  )
}

const primaryBtn = 'rounded-xl bg-gradient-to-r from-[#00694c] to-[#00b894] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#00694c]/25 transition disabled:cursor-not-allowed disabled:opacity-50'
const secondaryBtn = 'rounded-xl border border-[#dee4de] bg-white/70 px-5 py-2.5 text-sm font-medium text-[#3d4943] backdrop-blur transition hover:bg-white dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-100'

function MotionBtn({ children, className, ...rest }) {
  return (
    <motion.button className={className} type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} {...rest}>
      {children}
    </motion.button>
  )
}

// ── Normalize the 3 backend sources into one shape so Médecins/Centres can
// be grouped by TYPE rather than by where the data came from ─────────────────
const OSM_CATEGORY_LABELS = { doctors: 'Médecin', clinic: 'Clinique', hospital: 'Hôpital' }

function normalizePlatform(doc) {
  return {
    kind: 'medecin', source: 'platform', bookable: true,
    id: doc.uid, name: doc.name, specialization: doc.specialization,
    categoryLabel: 'SmartHealth', location: doc.location, phone: doc.phone,
    email: doc.email, website: null, rating: doc.rating, distanceKm: null,
    lat: null, lng: null,
  }
}

function normalizeExternal(doc) {
  return {
    kind: 'medecin', source: 'med.tn', bookable: false,
    id: doc.sourceUrl, name: doc.name, specialization: doc.specialization,
    categoryLabel: 'med.tn', location: doc.location, phone: doc.phone,
    email: null, website: null, rating: null, distanceKm: null,
    lat: doc.lat, lng: doc.lng,
  }
}

function normalizeOsm(doc) {
  const isDoctor = doc.category === 'doctors'
  return {
    kind: isDoctor ? 'medecin' : 'centre', source: 'osm', bookable: false,
    id: doc.id, name: doc.name, specialization: null,
    categoryLabel: OSM_CATEGORY_LABELS[doc.category] || 'OpenStreetMap',
    location: doc.address, phone: doc.phone, email: doc.email, website: doc.website,
    rating: null, distanceKm: doc.distanceKm, lat: doc.lat, lng: doc.lng,
  }
}

const SOURCE_ACCENT = { platform: '#00694c', 'med.tn': '#6d7a73', osm: '#0060a8' }
const SOURCE_BADGE_CLASS = {
  platform: 'bg-gradient-to-r from-[#00694c] to-[#00b894]',
  'med.tn': 'bg-[#6d7a73]',
  osm: 'bg-gradient-to-r from-[#0060a8] to-[#5b9cff]',
}

// ── Unified result card — Médecins and Centres render the same way regardless
// of which backend source they came from; all actions (booking, itinéraire,
// téléphone, email) live in the in-app fiche modal, opened from here ────────
function DoctorCard({ doctor, onOpenDetail }) {
  const accent = doctor.kind === 'centre' ? '#5b6cff' : SOURCE_ACCENT[doctor.source]
  const badgeClass = doctor.kind === 'centre' ? 'bg-gradient-to-r from-[#5b6cff] to-[#7c9cff]' : SOURCE_BADGE_CLASS[doctor.source]

  return (
    <motion.article
      className="overflow-hidden rounded-2xl border border-white/60 bg-white/85 p-4 shadow-md backdrop-blur transition dark:border-white/10 dark:bg-slate-900/70"
      style={{ borderLeft: `5px solid ${accent}` }}
      whileHover={{ y: -3 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white ${badgeClass}`}>
            {doctor.categoryLabel}
          </span>
          <h3 className="mt-1.5 font-semibold text-[#171d1a] dark:text-white">{doctor.name}</h3>
          {doctor.specialization && <p className="text-xs text-[#6d7a73] dark:text-slate-400">{doctor.specialization}</p>}
        </div>
        {doctor.rating ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-[#9a6700]">
            <Star size={13} fill="currentColor" />
            {Number(doctor.rating).toFixed(1)}
          </span>
        ) : null}
      </div>

      {doctor.location && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-[#6d7a73] dark:text-slate-400">
          <MapPin size={13} /> {doctor.location}
        </p>
      )}
      {doctor.distanceKm != null && (
        <p className="mt-1 text-xs font-semibold text-[#0060a8] dark:text-[#7cb8ff]">{doctor.distanceKm} km</p>
      )}

      <MotionBtn
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#e4eae4] px-3 py-1.5 text-xs font-semibold text-[#3d4943] dark:bg-slate-700 dark:text-slate-200"
        onClick={() => onOpenDetail(doctor)}
      >
        Voir la fiche
      </MotionBtn>
    </motion.article>
  )
}

function ResultsSection({ title, icon, count, children }) {
  if (count === 0) return null
  const Icon = icon
  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="space-y-3" initial={{ opacity: 0, y: 16 }} transition={{ duration: 0.3 }}>
      <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#3d4943] dark:text-slate-200">
        <Icon size={14} />
        {title}
        <span className="rounded-full bg-gradient-to-r from-[#00694c] to-[#0060a8] px-2 py-0.5 text-[10px] font-bold text-white">{count}</span>
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </motion.div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
function DoctorAgentPage() {
  const alerts = useMedAssistStore((s) => s.alerts)
  const recommendations = useMedAssistStore((s) => s.recommendations)
  const lastOrientation = useMedAssistStore((s) => s.lastOrientation)
  const userUid = getCurrentUser()?.uid || null

  // Local fallback heuristic — only used if the Doctor Agent's LLM decision
  // call fails, so the page never gets stuck without an answer. Checks alert
  // severity AND recommendation priority — a "haute" priority recommendation
  // is shown with the same red "URGENT" badge on the AI Recommendations page
  // (see AIAnalysisPage.jsx's PRIORITY_THEME), so it must count here too: a
  // patient with only "moderee" alerts but an urgent "Consultation médicale"
  // recommendation still needs the doctor offer.
  const severeAlert = alerts.find((a) => a.urgence === 'critique' || a.urgence === 'elevee')
  const urgentRecommendation = recommendations.find((r) => r.priorite === 'haute')
  const fallbackShouldRecommend = Boolean(
    severeAlert || urgentRecommendation || (lastOrientation?.niveau && lastOrientation.niveau !== 'automedication'),
  )
  const fallbackMessage = severeAlert
    ? `J'ai remarqué : ${severeAlert.titre}. Veux-tu que je te recommande un médecin ?`
    : urgentRecommendation
      ? `J'ai remarqué une recommandation prioritaire : "${urgentRecommendation.titre}". Veux-tu que je te recommande un médecin ?`
      : fallbackShouldRecommend
        ? `D'après mon analyse, ${lastOrientation?.raison || 'une consultation pourrait être utile'}. Veux-tu que je te recommande un médecin ?`
        : "Tout va bien pour l'instant, aucune consultation ne semble nécessaire d'après mes dernières analyses."

  const [phase, setPhase] = useState('booting')
  const [robotMood, setRobotMood] = useState('off')
  const [decision, setDecision] = useState(null)
  const [address, setAddress] = useState('')
  const [results, setResults] = useState(null)
  const [searchError, setSearchError] = useState(null)
  const [activeDoctor, setActiveDoctor] = useState(null)

  const specialty = (decision && decision.specialty) || lastOrientation?.specialite || null
  const greetingMessage = (decision && decision.message) || fallbackMessage

  // Each phase change is a direct response to a user action (button click,
  // search submit, the AI decision landing) — set the mood right alongside it
  // so the robot "talks" immediately, rather than deriving it from an effect.
  function goToPhase(newPhase) {
    setPhase(newPhase)
    setRobotMood(newPhase === 'searching' || newPhase === 'deciding' ? 'thinking' : 'talking')
  }

  // Boot sequence: the robot starts powered-down (red eyes) rather than
  // already mid-task, then "wakes up" (green) before settling into its
  // working "thinking" mood once it actually starts deciding. bootedRef
  // guards against the boot timers firing after the AI decision already
  // resolved (it can, in rare cases, answer faster than the boot animation).
  const bootedRef = useRef(false)
  useEffect(() => {
    let active = true
    const wakeUpTimer = setTimeout(() => {
      if (active && !bootedRef.current) setRobotMood('idle')
    }, 900)
    const startWorkingTimer = setTimeout(() => {
      if (active && !bootedRef.current) {
        bootedRef.current = true
        setPhase('deciding')
        setRobotMood('thinking')
      }
    }, 1500)

    // Ask the Doctor Agent's AI decision endpoint whether to proactively
    // offer a doctor right now — see mediassist_service/app.py. Falls back
    // to the local heuristic above on any error so a gateway outage never
    // blocks this page.
    getDoctorAgentDecision({ alerts, recommendations, orientation: lastOrientation }).then((result) => {
      if (!active) return
      bootedRef.current = true
      if (result.success && !result.decision?.error) {
        setDecision(result.decision)
        goToPhase(result.decision.shouldRecommend ? 'greeting-need' : 'greeting-no-need')
      } else {
        goToPhase(fallbackShouldRecommend ? 'greeting-need' : 'greeting-no-need')
      }
    })

    return () => {
      active = false
      clearTimeout(wakeUpTimer)
      clearTimeout(startWorkingTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally runs once on mount
  }, [])

  // Settle the "talking" pulse back to idle a moment after the speech bubble
  // text lands (skipped while booting/searching/deciding, which drive their
  // own mood independently above).
  useEffect(() => {
    if (phase === 'booting' || phase === 'searching' || phase === 'deciding') return
    const timeout = setTimeout(() => setRobotMood('idle'), 1400)
    return () => clearTimeout(timeout)
  }, [phase])

  // Prefill the location question with the patient's saved address, if any —
  // still editable, since the robot asks for it conversationally either way.
  useEffect(() => {
    getPatientProfile().then((result) => {
      if (result.success) {
        const profileAddress = result.data?.address || result.data?.city || result.data?.location
        if (profileAddress) setAddress(profileAddress)
      }
    })
  }, [])

  async function handleSearch() {
    if (!address.trim()) {
      toast.error('Indiquez votre ville ou adresse.')
      return
    }
    goToPhase('searching')
    setSearchError(null)
    const result = await searchNearbyDoctors(address.trim(), specialty)
    if (result.success) {
      setResults(result.data)
      goToPhase('results')
    } else {
      setSearchError(result.error)
      goToPhase('asking-location')
    }
  }

  const allDoctors = results
    ? [
        ...results.platform.map(normalizePlatform),
        ...results.external.map(normalizeExternal),
        ...results.osm.filter((d) => d.category === 'doctors').map(normalizeOsm),
      ]
    : []
  const allCenters = results
    ? results.osm.filter((d) => d.category !== 'doctors').map(normalizeOsm)
    : []
  const totalResults = allDoctors.length + allCenters.length

  function renderPhaseContent() {
    if (phase === 'booting') {
      return (
        <SpeechBubble tone="alert">
          <span className="flex items-center gap-2 text-[#6d7a73] dark:text-slate-400">
            Initialisation de l'Agent Médecin...
          </span>
        </SpeechBubble>
      )
    }

    if (phase === 'deciding') {
      return (
        <SpeechBubble>
          <span className="flex items-center gap-2">
            Je regarde ton dossier...<TypingDots />
          </span>
        </SpeechBubble>
      )
    }

    if (phase === 'greeting-need') {
      return (
        <>
          <SpeechBubble tone="alert">
            <p className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 shrink-0" size={15} />
              <span>{greetingMessage}</span>
            </p>
          </SpeechBubble>
          <div className="flex gap-3">
            <MotionBtn className={primaryBtn} onClick={() => goToPhase('asking-location')}>Oui</MotionBtn>
            <MotionBtn className={secondaryBtn} onClick={() => goToPhase('declined')}>Non</MotionBtn>
          </div>
        </>
      )
    }

    if (phase === 'greeting-no-need') {
      return (
        <>
          <SpeechBubble>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="shrink-0 text-[#00694c]" size={16} />
              {greetingMessage}
            </p>
          </SpeechBubble>
          <MotionBtn className={secondaryBtn} onClick={() => goToPhase('asking-location')}>
            Chercher un médecin quand même
          </MotionBtn>
        </>
      )
    }

    if (phase === 'declined') {
      return (
        <>
          <SpeechBubble>Pas de problème, je reste disponible si tu changes d'avis.</SpeechBubble>
          <MotionBtn className={primaryBtn} onClick={() => goToPhase('asking-location')}>Finalement, oui</MotionBtn>
        </>
      )
    }

    if (phase === 'asking-location' || phase === 'searching') {
      return (
        <>
          <SpeechBubble>
            {phase === 'searching' ? (
              <span className="flex items-center gap-2">
                Je cherche les médecins les plus proches de "{address}"<TypingDots />
              </span>
            ) : (
              "Où habites-tu ? Indique ta ville ou ton adresse pour que je trouve les médecins les plus proches."
            )}
          </SpeechBubble>
          {searchError && <p className="text-xs text-[#ba1a1a]">{searchError}</p>}
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-[#bccac1] bg-white/80 px-3 py-2 text-sm outline-none backdrop-blur transition focus:border-[#008560] focus:ring-2 focus:ring-[#008560]/20 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
              disabled={phase === 'searching'}
              placeholder="Ex : Sousse, ou Ariana Ville"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <MotionBtn className={`${primaryBtn} inline-flex items-center gap-1.5`} disabled={phase === 'searching'} onClick={handleSearch}>
              {phase === 'searching' ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
              Rechercher
            </MotionBtn>
          </div>
        </>
      )
    }

    if (phase === 'results') {
      return (
        <>
          <SpeechBubble>
            {totalResults > 0
              ? `Voici ${totalResults} résultat${totalResults > 1 ? 's' : ''} ${specialty ? `(${specialty}) ` : ''}près de "${address}".`
              : `Je n'ai trouvé aucun résultat près de "${address}" pour le moment.`}
            {results?.warning && <span className="mt-1 block text-xs text-[#9a6700]">{results.warning}</span>}
          </SpeechBubble>
          <button className="text-xs font-medium text-[#00694c] underline dark:text-[#5eead4]" type="button" onClick={() => goToPhase('asking-location')}>
            Nouvelle recherche
          </button>
        </>
      )
    }

    return null
  }

  return (
    <div className="relative">
      {/* Ambient gradient blobs — purely decorative, AI-lab atmosphere */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, -10, 0], y: [0, 30, -20, 0] }}
          className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#00f0a0]/20 blur-3xl"
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          animate={{ x: [0, -30, 20, 0], y: [0, 40, 10, 0] }}
          className="absolute -right-16 top-10 h-80 w-80 rounded-full bg-[#7c9cff]/20 blur-3xl"
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          animate={{ x: [0, 20, -20, 0] }}
          className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#00694c]/15 blur-3xl"
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="bg-gradient-to-r from-[#00694c] via-[#00b894] to-[#0060a8] bg-clip-text text-[28px] font-bold leading-tight text-transparent">
              Agent Médecin
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#00f0a0]/15 to-[#0060a8]/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#00694c] dark:text-[#5eead4]">
              <Sparkles size={11} />
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00f0a0] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#00b894]" />
              </span>
              IA active
            </span>
          </div>
          <p className="mt-1 text-sm text-[#6d7a73] dark:text-slate-400">
            Votre assistant pour trouver un médecin adapté, près de chez vous.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 p-5 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 md:flex md:flex-row md:items-center md:gap-6">
          <div className="w-full shrink-0 md:w-[280px]">
            <Robot3D height={240} state={robotMood} />
          </div>

          <div className="mt-4 flex-1 space-y-3 md:mt-0">
            <AnimatePresence mode="wait">
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
                exit={{ opacity: 0, y: -8 }}
                initial={{ opacity: 0, y: 10 }}
                key={phase}
                transition={{ duration: 0.25 }}
              >
                {renderPhaseContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {phase === 'results' && (
          <div className="space-y-6">
            <ResultsSection count={allDoctors.length} icon={Stethoscope} title="Médecins">
              {allDoctors.map((doc) => (
                <DoctorCard doctor={doc} key={`${doc.source}-${doc.id}`} onOpenDetail={setActiveDoctor} />
              ))}
            </ResultsSection>

            <ResultsSection count={allCenters.length} icon={Building2} title="Centres de santé">
              {allCenters.map((doc) => (
                <DoctorCard doctor={doc} key={`${doc.source}-${doc.id}`} onOpenDetail={setActiveDoctor} />
              ))}
            </ResultsSection>
          </div>
        )}

        <p className="flex items-center gap-1.5 text-[11px] text-[#6d7a73] dark:text-slate-500">
          <Clock size={12} /> L'Agent Médecin ne remplace pas un avis médical. En cas d'urgence, appelez le 190 (SAMU).
        </p>
      </div>

      <DoctorDetailModal
        doctor={activeDoctor}
        reason={greetingMessage}
        userUid={userUid}
        onClose={() => setActiveDoctor(null)}
      />
    </div>
  )
}

export default DoctorAgentPage
