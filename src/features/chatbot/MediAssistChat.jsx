import { AlertTriangle, BrainCircuit, CheckCircle2, ListChecks, Loader2, Send, ShieldAlert, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { sendMediAssistMessage } from '../../services/mediAssistService'
import { useMedAssistStore } from '../../store/medAssistStore'

// ── Urgence config ────────────────────────────────────────────────────────────
const URGENCE_CONFIG = {
  normale:  { label: 'Normale',  bg: 'bg-[#e4eae4]',   text: 'text-[#3d4943]',  border: 'border-[#bccac1]'   },
  moderee:  { label: 'Modérée',  bg: 'bg-[#fef3c7]',   text: 'text-[#92400e]',  border: 'border-[#fcd34d]'   },
  elevee:   { label: 'Élevée',   bg: 'bg-[#ffdad6]',   text: 'text-[#7e2a27]',  border: 'border-[#ff8a80]'   },
  critique: { label: 'CRITIQUE', bg: 'bg-[#93000a]',   text: 'text-white',       border: 'border-[#93000a]'   },
}

const ORIENTATION_LABELS = {
  automedication:      'Automédication',
  medecin_generaliste: 'Médecin généraliste',
  specialiste:         'Spécialiste',
  urgences:            'Urgences',
}

// Pre-built questions — sent through the same LLM turn as free-form input,
// so a tap here can also create new recommendations/alerts.
const QUICK_SUGGESTIONS = [
  { label: 'Conseils sommeil', prompt: 'Donne-moi des conseils concrets pour améliorer mon sommeil ce soir.' },
  { label: 'Menu du jour', prompt: 'Propose-moi un exemple de menu équilibré et adapté à mon profil pour aujourd’hui.' },
  { label: 'Exercices doux', prompt: 'Quels exercices physiques doux me recommandes-tu vu mon état actuel ?' },
]

// ── Structured analysis card (first message) ─────────────────────────────────
// Note: the "recommandations" parsed from the LLM's JSON response are rendered
// as cards on the AI Recommendations page (left panel), not duplicated here —
// the chat stays focused on the conversational summary, alerts and orientation.
function AnalysisCard({ parsed }) {
  const urg = URGENCE_CONFIG[parsed.urgence] || URGENCE_CONFIG.moderee
  const recCount = parsed.recommandations?.length || 0

  return (
    <div className={`rounded-xl border ${urg.border} overflow-hidden`}>
      {/* Urgence banner */}
      <div className={`${urg.bg} ${urg.text} flex items-center gap-2 px-4 py-2 text-sm font-bold`}>
        <ShieldAlert size={16} />
        Urgence : {urg.label}
      </div>

      <div className="space-y-4 bg-white p-4">
        {/* Alertes */}
        {parsed.alertes?.length > 0 && (
          <div className="rounded-lg border border-[#ffdad6] bg-[#fff8f7] p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#93000a]">Alertes</p>
            <ul className="space-y-1">
              {parsed.alertes.map((a, i) => (
                <li className="flex gap-2 text-sm text-[#7e2a27]" key={i}>
                  <AlertTriangle className="mt-0.5 shrink-0" size={14} />
                  {a}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-[#7e2a27]/80">→ Ajoutées au Centre d'Alertes.</p>
          </div>
        )}

        {/* Résumé */}
        <p className="text-sm font-medium text-[#3d4943]">{parsed.resume_situation}</p>

        {/* Analyse */}
        {parsed.urgence !== 'critique' && parsed.analyse && (
          <p className="text-sm leading-6 text-[#3d4943]">{parsed.analyse}</p>
        )}

        {/* Pointer vers le panneau de recommandations */}
        {recCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-[#dee4de] bg-[#f5fbf5] p-3 text-sm text-[#3d4943]">
            <ListChecks className="shrink-0 text-[#00694c]" size={18} />
            <span>
              <strong>{recCount}</strong> recommandation{recCount > 1 ? 's' : ''} personnalisée{recCount > 1 ? 's' : ''} {recCount > 1 ? 'ont' : 'a'} été ajoutée{recCount > 1 ? 's' : ''} dans le panneau de gauche.
            </span>
          </div>
        )}

        {/* Orientation */}
        {parsed.orientation && (
          <div className="rounded-lg border border-[#d2e4ff] bg-[#f0f6ff] p-3 text-sm">
            <p className="font-semibold text-[#0060a8]">
              {ORIENTATION_LABELS[parsed.orientation.niveau] || parsed.orientation.niveau}
              {parsed.orientation.specialite ? ` — ${parsed.orientation.specialite}` : ''}
            </p>
            <p className="mt-1 text-[#3d4943]">{parsed.orientation.raison}</p>
            <p className="mt-1 text-xs font-medium text-[#0060a8]">Délai : {parsed.orientation.delai}</p>
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
function AssistantBubble({ content }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#00694c] text-white shadow">
        <BrainCircuit size={18} />
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-[#dee4de] bg-white px-4 py-3 text-sm leading-6 text-[#3d4943] shadow-sm">
        {content}
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
function buildReviewItems(patientData) {
  if (!patientData) return []
  const items = []

  if (patientData.age || patientData.biologicalSex) {
    items.push({ label: 'Profil', value: `${patientData.age || '–'} ans · ${patientData.biologicalSex || '–'}` })
  }
  if (patientData.bloodPressureSys && patientData.bloodPressureDia) {
    items.push({ label: 'Tension artérielle', value: `${patientData.bloodPressureSys}/${patientData.bloodPressureDia} mmHg` })
  }
  if (patientData.heartRate) {
    items.push({ label: 'Fréquence cardiaque', value: `${patientData.heartRate} bpm` })
  }
  const symptoms = [...(patientData.symptoms || []), patientData.otherSymptoms].filter(Boolean)
  if (symptoms.length) {
    items.push({ label: 'Symptômes', value: symptoms.join(', ') })
  }
  if (patientData.chronicDiseases?.length) {
    items.push({ label: 'Antécédents', value: patientData.chronicDiseases.join(', ') })
  }
  if (patientData.sleepQuality || patientData.stressLevel) {
    items.push({ label: 'Mode de vie', value: `Sommeil : ${patientData.sleepQuality || '–'} · Stress : ${patientData.stressLevel || '–'}/5` })
  }

  return items.slice(0, 5)
}

function ThinkingBubble({ patientData }) {
  const items = buildReviewItems(patientData)

  return (
    <div className="flex items-start gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#00694c] text-white shadow">
        <BrainCircuit size={18} />
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-[#dee4de] bg-white px-4 py-3 text-sm shadow-sm">
        <div className="flex items-center gap-2 text-[#6d7a73]">
          <Loader2 className="animate-spin" size={15} />
          MediAssist passe vos informations en revue...
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
  // Conversation lives in the MediAssist store (persisted) so leaving this
  // page and coming back resumes the discussion instead of wiping it.
  // Each message: { role: 'user'|'assistant', text: string, parsed: object|null, isInitial: bool }
  const messages = useMedAssistStore((s) => s.chatMessages)
  const setMessages = useMedAssistStore((s) => s.setChatMessages)
  const chatSessionKey = useMedAssistStore((s) => s.chatSessionKey)
  const startChatSession = useMedAssistStore((s) => s.startChatSession)
  const appendChatHistory = useMedAssistStore((s) => s.appendChatHistory)

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

  // Send initial automated analysis on mount — this is what populates the
  // "no recommendations yet" panel as soon as the model responds. If the
  // patient wrote their own question in the form, lead with that instead of
  // the generic prompt, and show it as their message in the conversation.
  // Skipped entirely when resuming an existing conversation for this patient.
  useEffect(() => {
    if (hasInitializedRef.current) return
    hasInitializedRef.current = true

    if (hasPersistedMessages) {
      return // resume the persisted conversation as-is
    }

    // startChatSession reports whether IT actually claimed the session — if
    // another mount already did (a near-simultaneous race: StrictMode's
    // double-invoke, a lazy/Suspense replay...), back off instead of firing a
    // second concurrent analysis into the same conversation. The component
    // ref above only protects this one instance; the store call is the part
    // that's atomic across all of them.
    if (!startChatSession(sessionKey)) return

    const ownQuestion = patientData?.description?.trim()
    sendToLLM(ownQuestion || 'Analyse mes données et donne-moi tes recommandations.', true, Boolean(ownQuestion))
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

    setIsLoading(true)

    // Show the user's own message, but not the generic automated first prompt
    if (showUserMessage) {
      setMessages((prev) => [...prev, { role: 'user', text: userText }])
    }

    try {
      const { userContent, assistantContent, parsed } = await sendMediAssistMessage({
        patientData,
        history: useMedAssistStore.getState().chatHistory,
        userText,
      })

      if (isStale()) return

      appendChatHistory([
        { role: 'user', content: userContent },
        { role: 'assistant', content: assistantContent },
      ])

      // New recommendations/alerts from this turn become cards on the AI
      // Recommendations page (left panel) and entries in the Alerts center.
      useMedAssistStore.getState().applyAnalysis(parsed)

      const displayText = parsed.analyse || parsed.resume_situation || ''
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: displayText, parsed, isInitial },
      ])
    } catch (err) {
      if (isStale()) return

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: err.message || "Une erreur est survenue. Vérifiez la connexion au serveur d'analyse.",
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
          <h2 className="font-bold text-[#171d1a]">Assistant MediAssist</h2>
          <p className="text-xs text-[#6d7a73]">Assistant médical IA — Propulsé par MedGemma 1.5</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-[#d1fae5] px-3 py-1 text-xs font-semibold text-[#065f46]">
          <CheckCircle2 size={12} />
          CONNECTÉ
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
                    Vous pouvez me poser des questions sur votre santé ci-dessous.
                  </p>
                </div>
              </div>
            )
          }
          return <AssistantBubble key={i} content={msg.text} />
        })}

        {isLoading && <ThinkingBubble patientData={patientData} />}
        <div ref={bottomRef} />
      </div>

      {/* ── Quick suggestions ── */}
      <div className="flex flex-wrap gap-2 border-t border-[#dee4de] bg-white px-4 pt-3">
        {QUICK_SUGGESTIONS.map((s) => (
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
            placeholder="Posez une question..."
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
          MediAssist ne remplace pas un avis médical. En cas d'urgence, appelez le 15 (SAMU).
        </p>
      </div>
    </div>
  )
}
