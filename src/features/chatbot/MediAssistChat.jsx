import { AlertTriangle, BrainCircuit, CheckCircle2, ListChecks, Loader2, Send, ShieldAlert, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import { useTranslation } from '../../i18n/useTranslation'
import { createAlert } from '../../services/alertsService'
import { getCurrentUser } from '../../services/authService'
import { getRecommendationsHistory, sendMediAssistMessage } from '../../services/mediAssistService'
import { useMedAssistStore } from '../../store/medAssistStore'
import { queryClient } from '../../lib/queryClient'

// ── Urgence config ────────────────────────────────────────────────────────────
function getUrgenceConfig(t) {
  return {
    normale:  { label: t('mediAssistChat.urgence.normale', 'Normale'),  bg: 'bg-[#e4eae4]',   text: 'text-[#3d4943]',  border: 'border-[#bccac1]'   },
    moderee:  { label: t('mediAssistChat.urgence.moderee', 'Modérée'),  bg: 'bg-[#fef3c7]',   text: 'text-[#92400e]',  border: 'border-[#fcd34d]'   },
    elevee:   { label: t('mediAssistChat.urgence.elevee', 'Élevée'),    bg: 'bg-[#ffdad6]',   text: 'text-[#7e2a27]',  border: 'border-[#ff8a80]'   },
    critique: { label: t('mediAssistChat.urgence.critique', 'CRITIQUE'), bg: 'bg-[#93000a]',  text: 'text-white',     border: 'border-[#93000a]'   },
  }
}

function getOrientationLabels(t) {
  return {
    automedication:      t('mediAssistChat.orientation.automedication', 'Automédication'),
    medecin_generaliste: t('mediAssistChat.orientation.medecinGeneraliste', 'Médecin généraliste'),
    specialiste:         t('mediAssistChat.orientation.specialiste', 'Spécialiste'),
    urgences:            t('mediAssistChat.orientation.urgences', 'Urgences'),
  }
}

// Pre-built questions — sent through the same LLM turn as free-form input,
// so a tap here can also create new recommendations/alerts.
function getQuickSuggestions(t) {
  return [
    {
      label: t('mediAssistChat.quickSuggestions.sleepAdviceLabel', 'Conseils sommeil'),
      prompt: t('mediAssistChat.quickSuggestions.sleepAdvicePrompt', 'Donne-moi des conseils concrets pour améliorer mon sommeil ce soir.'),
    },
    {
      label: t('mediAssistChat.quickSuggestions.dailyMenuLabel', 'Menu du jour'),
      prompt: t('mediAssistChat.quickSuggestions.dailyMenuPrompt', 'Propose-moi un exemple de menu équilibré et adapté à mon profil pour aujourd’hui.'),
    },
    {
      label: t('mediAssistChat.quickSuggestions.gentleExerciseLabel', 'Exercices doux'),
      prompt: t('mediAssistChat.quickSuggestions.gentleExercisePrompt', 'Quels exercices physiques doux me recommandes-tu vu mon état actuel ?'),
    },
  ]
}

// ── Formatted text rendering ──────────────────────────────────────────────────
// The model is asked to format "analyse" as short paragraphs (blank-line
// separated) with **bold** markdown for key terms/values — render both here
// so the same helper applies in the chat bubble and the initial analysis card.
function renderBoldSegments(line) {
  return line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>,
  )
}

function FormattedText({ content, className }) {
  // The model is expected to put a string here, but has been observed
  // returning [] or {} for an empty field instead (truthy in JS, so
  // `content || ''` doesn't catch it) — guard so a malformed reply degrades
  // to an empty bubble instead of crashing the whole chat.
  const text = typeof content === 'string' ? content : ''
  const paragraphs = text.split(/\n\n+/)
  return paragraphs.map((para, i) => (
    <p className={className} key={i}>
      {para.split('\n').map((line, j, arr) => (
        <span key={j}>
          {renderBoldSegments(line)}
          {j < arr.length - 1 && <br />}
        </span>
      ))}
    </p>
  ))
}

// ── Structured analysis card (first message) ─────────────────────────────────
// Note: the "recommandations" parsed from the LLM's JSON response are rendered
// as cards on the AI Recommendations page (left panel), not duplicated here —
// the chat stays focused on the conversational summary, alerts and orientation.
function AnalysisCard({ parsed }) {
  const { t } = useTranslation()
  const urgenceConfig = getUrgenceConfig(t)
  const orientationLabels = getOrientationLabels(t)
  const urg = urgenceConfig[parsed.urgence] || urgenceConfig.moderee
  const recCount = parsed.recommandations?.length || 0

  return (
    <div className={`rounded-xl border ${urg.border} overflow-hidden`}>
      {/* Urgence banner */}
      <div className={`${urg.bg} ${urg.text} flex items-center gap-2 px-4 py-2 text-sm font-bold`}>
        <ShieldAlert size={16} />
        {t('mediAssistChat.analysisCard.urgenceLabel', 'Urgence : {{label}}', { label: urg.label })}
      </div>

      <div className="space-y-4 bg-white p-4">
        {/* Alertes */}
        {parsed.alertes?.length > 0 && (
          <div className="rounded-lg border border-[#ffdad6] bg-[#fff8f7] p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#93000a]">{t('mediAssistChat.analysisCard.alertsHeading', 'Alertes')}</p>
            <ul className="space-y-2.5">
              {parsed.alertes.map((a, i) => {
                const isObj = a && typeof a === 'object'
                const titre  = isObj ? a.titre  : a
                const detail = isObj ? a.detail : null
                const action = isObj ? a.action : null
                return (
                  <li key={i} className="flex gap-2 text-sm text-[#7e2a27]">
                    <AlertTriangle className="mt-0.5 shrink-0" size={14} />
                    <div>
                      <p className="font-semibold">{titre}</p>
                      {detail && <p className="mt-0.5 text-xs leading-5">{detail}</p>}
                      {action && <p className="mt-0.5 text-xs italic">→ {action}</p>}
                    </div>
                  </li>
                )
              })}
            </ul>
            <p className="mt-2 text-xs text-[#7e2a27]/80">{t('mediAssistChat.analysisCard.alertsAddedNote', '→ Ajoutées dans le panneau de gauche.')}</p>
          </div>
        )}

        {/* Résumé */}
        <p className="text-sm font-medium text-[#3d4943]">{parsed.resume_situation}</p>

        {/* Analyse */}
        {parsed.urgence !== 'critique' && parsed.analyse && (
          <div className="space-y-2 text-sm leading-6 text-[#3d4943]">
            <FormattedText content={parsed.analyse} />
          </div>
        )}

        {/* Pointer vers le panneau de recommandations */}
        {recCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-[#dee4de] bg-[#f5fbf5] p-3 text-sm text-[#3d4943]">
            <ListChecks className="shrink-0 text-[#00694c]" size={18} />
            <span>
              <strong>{recCount}</strong>{' '}
              {t(
                'mediAssistChat.analysisCard.recommendationsAddedNote',
                'recommandation{{plural}} personnalisée{{plural}} {{verb}} été ajoutée{{plural}} dans le panneau de gauche.',
                { plural: recCount > 1 ? 's' : '', verb: recCount > 1 ? 'ont' : 'a' },
              )}
            </span>
          </div>
        )}

        {/* Orientation */}
        {parsed.orientation && (
          <div className="rounded-lg border border-[#d2e4ff] bg-[#f0f6ff] p-3 text-sm">
            <p className="font-semibold text-[#0060a8]">
              {orientationLabels[parsed.orientation.niveau] || parsed.orientation.niveau}
              {parsed.orientation.specialite ? ` — ${parsed.orientation.specialite}` : ''}
            </p>
            <p className="mt-1 text-[#3d4943]">{parsed.orientation.raison}</p>
            <p className="mt-1 text-xs font-medium text-[#0060a8]">{t('mediAssistChat.analysisCard.delayLabel', 'Délai : {{delai}}', { delai: parsed.orientation.delai })}</p>
          </div>
        )}

        {/* Disclaimer */}
        {parsed.disclaimer && (
          <p className="text-xs italic text-[#6d7a73]">{parsed.disclaimer}</p>
        )}
      </div>
    </div>
  )
}

// ── Chat bubble ───────────────────────────────────────────────────────────────
// Follow-up turns sometimes put the actual substance of the answer (e.g.
// concrete diet/exercise advice) into "recommandations" rather than
// "analyse" — by design those cards otherwise only surface later on the AI
// Recommendations page, so a question asked directly in the chat ("donne-moi
// des conseils pour...") could get a generic/empty-feeling bubble even
// though the model did produce real content, just on the wrong field.
// Rendering them inline guarantees the answer is visible right where the
// patient asked for it, regardless of which field the model used.
function AssistantBubble({ content, parsed }) {
  const recommandations = parsed?.recommandations || []
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#00694c] text-white shadow">
        <BrainCircuit size={18} />
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-[#dee4de] bg-white px-4 py-3 text-sm leading-6 text-[#3d4943] shadow-sm space-y-2">
        <FormattedText content={content} />
        {recommandations.length > 0 && (
          <ul className="space-y-2 border-t border-[#dee4de] pt-2">
            {recommandations.map((r, i) => (
              <li className="flex gap-2" key={i}>
                <ListChecks className="mt-0.5 shrink-0 text-[#00694c]" size={14} />
                <div>
                  <p className="font-semibold">{r.titre}</p>
                  {r.detail && <p className="text-xs leading-5 text-[#6d7a73]">{r.detail}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function UserBubble({ content }) {
  return (
    <div className="flex items-start justify-end gap-3">
      <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[#00694c] px-4 py-3 text-sm leading-6 text-white shadow">
        {content}
      </div>
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e4eae4] text-[#3d4943]">
        <User size={18} />
      </div>
    </div>
  )
}

// Pull a handful of the patient's own data points to surface while the model
// "thinks" — seeing their own info scroll by makes the wait feel like real
// work being done on their case, not a generic spinner.
function buildReviewItems(patientData, t) {
  if (!patientData) return []
  const items = []

  if (patientData.age || patientData.biologicalSex) {
    items.push({
      label: t('mediAssistChat.reviewItem.profileLabel', 'Profil'),
      value: t('mediAssistChat.reviewItem.profileValue', '{{age}} ans · {{sex}}', {
        age: patientData.age || '–',
        sex: patientData.biologicalSex || '–',
      }),
    })
  }
  if (patientData.bloodPressureSys && patientData.bloodPressureDia) {
    items.push({
      label: t('mediAssistChat.reviewItem.bloodPressureLabel', 'Tension artérielle'),
      value: `${patientData.bloodPressureSys}/${patientData.bloodPressureDia} mmHg`,
    })
  }
  if (patientData.heartRate) {
    items.push({
      label: t('mediAssistChat.reviewItem.heartRateLabel', 'Fréquence cardiaque'),
      value: `${patientData.heartRate} bpm`,
    })
  }
  const symptoms = [...(patientData.symptoms || []), patientData.otherSymptoms].filter(Boolean)
  if (symptoms.length) {
    items.push({ label: t('mediAssistChat.reviewItem.symptomsLabel', 'Symptômes'), value: symptoms.join(', ') })
  }
  if (patientData.chronicDiseases?.length) {
    items.push({ label: t('mediAssistChat.reviewItem.historyLabel', 'Antécédents'), value: patientData.chronicDiseases.join(', ') })
  }
  if (patientData.sleepQuality || patientData.stressLevel) {
    items.push({
      label: t('mediAssistChat.reviewItem.lifestyleLabel', 'Mode de vie'),
      value: t('mediAssistChat.reviewItem.lifestyleValue', 'Sommeil : {{sleep}} · Stress : {{stress}}/5', {
        sleep: patientData.sleepQuality || '–',
        stress: patientData.stressLevel || '–',
      }),
    })
  }

  return items.slice(0, 5)
}

function ThinkingBubble({ patientData }) {
  const { t } = useTranslation()
  const items = buildReviewItems(patientData, t)

  return (
    <div className="flex items-start gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#00694c] text-white shadow">
        <BrainCircuit size={18} />
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-[#dee4de] bg-white px-4 py-3 text-sm shadow-sm">
        <div className="flex items-center gap-2 text-[#6d7a73]">
          <Loader2 className="animate-spin" size={15} />
          {t('mediAssistChat.thinkingBubble.reviewingMessage', 'MediAssist passe vos informations en revue...')}
        </div>
        {items.length > 0 && (
          <ul className="mt-3 space-y-1.5 border-t border-[#dee4de] pt-3">
            {items.map((item, i) => (
              <li
                className="flex flex-wrap items-center gap-1.5 text-xs leading-5 text-[#3d4943] animate-pulse"
                key={item.label}
                style={{ animationDelay: `${i * 0.18}s` }}
              >
                <CheckCircle2 className="shrink-0 text-[#00694c]" size={13} />
                <span className="font-semibold">{item.label} :</span>
                <span className="text-[#6d7a73]">{item.value}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function MediAssistChat({ patientData }) {
  const { t } = useTranslation()
  // Conversation lives in the MediAssist store (persisted) so leaving this
  // page and coming back resumes the discussion instead of wiping it.
  // Each message: { role: 'user'|'assistant', text: string, parsed: object|null, isInitial: bool }
  const messages = useMedAssistStore((s) => s.chatMessages)
  const setMessages = useMedAssistStore((s) => s.setChatMessages)
  const chatSessionKey = useMedAssistStore((s) => s.chatSessionKey)
  const chatSessionId = useMedAssistStore((s) => s.chatSessionId)
  const startChatSession = useMedAssistStore((s) => s.startChatSession)
  const appendChatHistory = useMedAssistStore((s) => s.appendChatHistory)

  const userUid = getCurrentUser()?.uid || null

  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  // Guards the initial analysis call against StrictMode's dev double-invoke —
  // without it, mount → cleanup → mount fires sendToLLM twice and the first
  // request gets cancelled mid-flight (visible as "cancelled" in the Network tab).
  const hasInitializedRef = useRef(false)

  // Fingerprint of the current patient data — a fresh form submission produces
  // a different fingerprint (new conversation), while returning to the same
  // analysis (e.g. browser back) keeps the fingerprint and resumes the chat.
  const sessionKey = patientData ? JSON.stringify(patientData) : null
  const isCurrentSession = sessionKey === chatSessionKey
  const hasPersistedMessages = isCurrentSession && messages.length > 0
  // The store may still be holding a previous patient's conversation for an
  // instant after a fresh form submission (it's only cleared once the mount
  // effect below calls startChatSession) — filter it out so it never flashes
  // on screen while this session is about to replace it.
  const visibleMessages = isCurrentSession ? messages : []

  // Show "MediAssist is thinking" from the very first paint of a fresh
  // analysis — not after a tick once the mount effect kicks in — so the
  // patient sees the assistant at work on their data immediately, with no
  // intermediate static placeholder bubble.
  const [isLoading, setIsLoading] = useState(() => !hasPersistedMessages)

  // Auto-scroll — depend on the stable store array + the session flag rather
  // than visibleMessages (a fresh [] literal on every render of a stale
  // session would otherwise re-fire this on each paint).
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isCurrentSession, isLoading])

  // Backfills the recommendations panel from the patient's persisted history
  // (see services/mediAssistService.getRecommendationsHistory) whenever it's
  // empty — covers both a fresh turn whose LLM call just failed (called from
  // sendToLLM below) and a *resumed* session that was left empty by an
  // earlier failed attempt, before this fallback existed, and would
  // otherwise never retry (the mount effect skips calling the LLM at all
  // when resuming — see hasPersistedMessages below).
  function loadFallbackIfEmpty() {
    if (!userUid) return
    if (useMedAssistStore.getState().recommendations.length > 0) return
    const requestSessionKey = sessionKey
    getRecommendationsHistory({ userUid }).then(({ success, recommendations }) => {
      if (useMedAssistStore.getState().chatSessionKey !== requestSessionKey) return
      if (success && recommendations.length > 0) {
        useMedAssistStore.getState().loadFallbackRecommendations(recommendations)
      }
    })
  }

  // Send initial automated analysis on mount — this is what populates the
  // "no recommendations yet" panel as soon as the model responds. If the
  // patient wrote their own question in the form, lead with that instead of
  // the generic prompt, and show it as their message in the conversation.
  // Skipped entirely when resuming an existing conversation for this patient.
  useEffect(() => {
    if (hasInitializedRef.current) {
      // StrictMode double-mount: mount #1 already started the API call. Stay in
      // loading state (ThinkingBubble visible) and subscribe to the store so we
      // clear the loader the instant mount #1's response lands.
      if (!hasPersistedMessages) {
        const unsub = useMedAssistStore.subscribe((state) => {
          if (state.chatMessages.length > 0 || state.chatSessionKey !== sessionKey) {
            setIsLoading(false)
            unsub()
          }
        })
        return unsub
      }
      return
    }
    hasInitializedRef.current = true

    if (hasPersistedMessages) {
      loadFallbackIfEmpty()
      return // resume the persisted conversation as-is
    }

    if (!startChatSession(sessionKey)) {
      // Another mount claimed the session (edge case outside StrictMode).
      const unsub = useMedAssistStore.subscribe((state) => {
        if (state.chatMessages.length > 0 || state.chatSessionKey !== sessionKey) {
          setIsLoading(false)
          unsub()
        }
      })
      return unsub
    }

    const ownQuestion = patientData?.description?.trim()
    sendToLLM(
      ownQuestion || t('mediAssistChat.defaultAnalysisPrompt', 'Analyse mes données et donne-moi tes recommandations.'),
      true,
      Boolean(ownQuestion),
    )
  }, [])

  // ── Simple chat turn: hand the patient profile, the persisted conversation
  // history and the new question to the MediAssist backend (mediassist_service
  // — see services/mediAssistService.js), which builds the system/user prompts,
  // calls the model and parses its JSON reply. The patient profile travels in
  // the system prompt (sent on every turn) and in the running history, so a
  // follow-up question stays grounded in the original analysis without having
  // to repeat the full profile on each turn (see prompt_builder.py).
  async function sendToLLM(userText, isInitial = false, showUserMessage = !isInitial) {
    // Captured so a reply that arrives after the patient has already started
    // a new analysis (new form submission → new sessionKey) can be told apart
    // from one belonging to the conversation that's still on screen — without
    // this, a slow, abandoned turn would land its message/history/recommendations
    // in the new session once it finally resolves.
    const requestSessionKey = sessionKey
    const isStale = () => useMedAssistStore.getState().chatSessionKey !== requestSessionKey

    // flushSync forces React to commit the ThinkingBubble to the DOM
    // synchronously before the API request starts — without this, a fast
    // (gateway-cached) response can resolve within the same render batch,
    // and the browser never paints the loading state.
    flushSync(() => {
      setIsLoading(true)
      if (showUserMessage) {
        setMessages((prev) => [...prev, { role: 'user', text: userText }])
      }
    })

    try {
      // Enforce a minimum visible loading time so the ThinkingBubble is always
      // perceptible — without this a fast error response (e.g. empty content
      // from the model) dismisses the loader before the user even sees it.
      const [{ userContent, assistantContent, parsed, error }] = await Promise.all([
        sendMediAssistMessage({
          patientData,
          history: useMedAssistStore.getState().chatHistory,
          userText,
          userUid,
          sessionId: useMedAssistStore.getState().chatSessionId,
        }),
        new Promise((r) => setTimeout(r, 1500)),
      ])

      if (isStale()) return

      appendChatHistory([
        { role: 'user', content: userContent },
        { role: 'assistant', content: assistantContent },
      ])

      // Only the initial analysis seeds the AI Recommendations page (left
      // panel) and the Alerts center — a follow-up question's recommandations
      // are shown inline in the chat bubble (see AssistantBubble) but never
      // written to the store, so the left panel stays exactly as the initial
      // analysis left it no matter how the conversation continues.
      if (isInitial) {
        useMedAssistStore.getState().applyAnalysis(parsed)

        // mediassist_service persists this turn's recommendations server-side
        // (see app.py's _save_recommendations) in the same request, so the
        // dashboard's "Recommandation IA" card has fresh data to fetch — but
        // its query stays cached for staleTime (queryClient.js) unless told
        // otherwise, so without this it would keep showing whatever was
        // current before this analysis ran.
        queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] })

        // Unlike recommendations, alertes from a MediAssist analysis only
        // ever lived in the client-side store (AI Analysis page) — the
        // dashboard's "Alerte non lue" card and unread count only knew about
        // vitals-threshold alerts (backend/api/vitals.py). Persist each one
        // as a real alert too, so a severe MediAssist finding (e.g. "Douleur
        // intense") surfaces there exactly like a vitals-threshold alert
        // does.
        const alertesToSave = (parsed.alertes || []).filter(Boolean)
        if (alertesToSave.length > 0 && userUid) {
          Promise.all(
            alertesToSave.map((a) =>
              createAlert({
                userUid,
                title: typeof a === 'string' ? a : a.titre || 'Alerte MediAssist',
                message: typeof a === 'string' ? a : a.detail || a.action || '',
                category: 'mediassist',
              }),
            ),
          ).then(() => {
            queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
          })
        }

        // `error` set means the LLM gateway call itself failed (timeout,
        // unreachable...) — `parsed` is then just the generic, empty
        // FALLBACK_RESPONSE, not a real "nothing to recommend" analysis. Back
        // the panel with the patient's last known-good recommendations
        // instead of leaving it empty.
        if (error) {
          loadFallbackIfEmpty()
        }
      }

      const displayText = parsed.analyse || parsed.resume_situation || ''
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: displayText, parsed, isInitial },
      ])
    } catch (err) {
      if (isStale()) return

      const errText = err.message || t('mediAssistChat.error.analysisServerError', "Une erreur est survenue. Vérifiez la connexion au serveur d'analyse.")
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: errText,
          parsed: null,
          isInitial: false,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function handleSend() {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    sendToLLM(text)
  }

  function handleSuggestion(prompt) {
    if (isLoading) return
    sendToLLM(prompt)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-full min-h-[560px] flex-col overflow-hidden rounded-2xl border border-[#bccac1]/40 bg-[#f5fbf5] shadow-lg">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 border-b border-[#dee4de] bg-white px-5 py-4">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#00694c] text-white shadow">
          <BrainCircuit size={22} />
        </div>
        <div>
          <h2 className="font-bold text-[#171d1a]">{t('mediAssistChat.header.title', 'Assistant MediAssist')}</h2>
          <p className="text-xs text-[#6d7a73]">{t('mediAssistChat.header.subtitle', 'Assistant médical IA — Propulsé par MedGemma 1.5')}</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-[#d1fae5] px-3 py-1 text-xs font-semibold text-[#065f46]">
          <CheckCircle2 size={12} />
          {t('mediAssistChat.header.connectedBadge', 'CONNECTÉ')}
        </span>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {visibleMessages.map((msg, i) => {
          if (msg.role === 'user') {
            return <UserBubble key={i} content={msg.text} />
          }
          // Assistant message
          if (msg.isInitial && msg.parsed) {
            return (
              <div className="flex items-start gap-3" key={i}>
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#00694c] text-white shadow">
                  <BrainCircuit size={18} />
                </div>
                <div className="flex-1">
                  <AnalysisCard parsed={msg.parsed} />
                  <p className="mt-2 px-1 text-xs text-[#6d7a73]">
                    {t('mediAssistChat.analysisCard.followUpHint', 'Vous pouvez me poser des questions sur votre santé ci-dessous.')}
                  </p>
                </div>
              </div>
            )
          }
          return <AssistantBubble content={msg.text} key={i} parsed={msg.parsed} />
        })}

        {isLoading && <ThinkingBubble patientData={patientData} />}
        <div ref={bottomRef} />
      </div>

      {/* ── Quick suggestions ── */}
      <div className="flex flex-wrap gap-2 border-t border-[#dee4de] bg-white px-4 pt-3">
        {getQuickSuggestions(t).map((s) => (
          <button
            className="rounded-full border border-[#bccac1] bg-[#f5fbf5] px-3 py-1.5 text-xs font-medium text-[#3d4943] transition hover:border-[#00694c] hover:text-[#00694c] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={isLoading}
            key={s.label}
            type="button"
            onClick={() => handleSuggestion(s.prompt)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Input ── */}
      <div className="bg-white px-4 pb-3 pt-2">
        <div className="flex items-end gap-3">
          <textarea
            className="flex-1 resize-none rounded-xl border border-[#bccac1] bg-[#f5fbf5] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#008560] focus:ring-2 focus:ring-[#008560]/20 disabled:opacity-50"
            disabled={isLoading}
            maxLength={600}
            placeholder={t('mediAssistChat.inputPlaceholder', 'Posez une question...')}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#00694c] text-white shadow transition hover:bg-[#008560] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={isLoading || !input.trim()}
            type="button"
            onClick={handleSend}
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-[#6d7a73]">
          {t('mediAssistChat.footer.disclaimer', "MediAssist ne remplace pas un avis médical. En cas d'urgence, appelez le 15 (SAMU).")}
        </p>
      </div>
    </div>
  )
}
