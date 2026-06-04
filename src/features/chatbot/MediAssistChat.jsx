import { AlertTriangle, BrainCircuit, CheckCircle2, Loader2, Send, ShieldAlert, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { callMediAssist, FALLBACK_RESPONSE, parseResponse } from '../../services/llmService'
import { buildSystemPrompt, buildUserMessage } from '../../utils/promptBuilder'

// ── Urgence config ────────────────────────────────────────────────────────────
const URGENCE_CONFIG = {
  normale:  { label: 'Normale',  bg: 'bg-[#e4eae4]',   text: 'text-[#3d4943]',  border: 'border-[#bccac1]'   },
  moderee:  { label: 'Modérée',  bg: 'bg-[#fef3c7]',   text: 'text-[#92400e]',  border: 'border-[#fcd34d]'   },
  elevee:   { label: 'Élevée',   bg: 'bg-[#ffdad6]',   text: 'text-[#7e2a27]',  border: 'border-[#ff8a80]'   },
  critique: { label: 'CRITIQUE', bg: 'bg-[#93000a]',   text: 'text-white',       border: 'border-[#93000a]'   },
}

const PRIORITE_CONFIG = {
  haute:   'bg-[#ffdad6] text-[#93000a]',
  moyenne: 'bg-[#fef3c7] text-[#92400e]',
  basse:   'bg-[#d1fae5] text-[#065f46]',
}

const ORIENTATION_LABELS = {
  automedication:      'Automédication',
  medecin_generaliste: 'Médecin généraliste',
  specialiste:         'Spécialiste',
  urgences:            'Urgences',
}

// ── Structured analysis card (first message) ─────────────────────────────────
function AnalysisCard({ parsed }) {
  const urg = URGENCE_CONFIG[parsed.urgence] || URGENCE_CONFIG.moderee

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
          </div>
        )}

        {/* Résumé */}
        <p className="text-sm font-medium text-[#3d4943]">{parsed.resume_situation}</p>

        {/* Analyse */}
        {parsed.urgence !== 'critique' && parsed.analyse && (
          <p className="text-sm leading-6 text-[#3d4943]">{parsed.analyse}</p>
        )}

        {/* Recommandations */}
        {parsed.recommandations?.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#171d1a]">Recommandations</p>
            <div className="space-y-2">
              {parsed.recommandations.map((r, i) => (
                <div className="rounded-lg border border-[#dee4de] bg-[#f5fbf5] p-3" key={i}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[#171d1a]">{r.titre}</p>
                    <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${PRIORITE_CONFIG[r.priorite] || PRIORITE_CONFIG.basse}`}>
                      {r.priorite}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-[#3d4943]">{r.detail}</p>
                </div>
              ))}
            </div>
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

function ThinkingBubble() {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#00694c] text-white shadow">
        <BrainCircuit size={18} />
      </div>
      <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-[#dee4de] bg-white px-4 py-3 text-sm text-[#6d7a73] shadow-sm">
        <Loader2 className="animate-spin" size={15} />
        MediAssist analyse...
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function MediAssistChat({ patientData }) {
  // Each message: { role: 'user'|'assistant', text: string, parsed: object|null, isInitial: bool }
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef(null)
  // LLM conversation history (role/content pairs for the API)
  const historyRef = useRef([])
  const systemPromptRef = useRef(buildSystemPrompt(patientData))
  const abortRef = useRef(null)

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Send initial automated analysis on mount
  useEffect(() => {
    sendToLLM('Analyse mes données et donne-moi tes recommandations.', true)
    return () => abortRef.current?.abort()
  }, [])

  async function sendToLLM(userText, isInitial = false) {
    setIsLoading(true)

    // Add user message to UI (don't show the automated first message)
    if (!isInitial) {
      setMessages((prev) => [...prev, { role: 'user', text: userText }])
    }

    // Build user message with re-injected patient context
    const userContent = buildUserMessage(patientData, userText)

    // Update LLM history
    historyRef.current = [
      ...historyRef.current,
      { role: 'user', content: userContent },
    ]

    const apiMessages = [
      { role: 'system', content: systemPromptRef.current },
      ...historyRef.current,
    ]

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const raw = await callMediAssist(apiMessages, controller.signal)
      const parsed = parseResponse(raw) || FALLBACK_RESPONSE

      // Store assistant response in history
      historyRef.current = [
        ...historyRef.current,
        { role: 'assistant', content: raw || JSON.stringify(FALLBACK_RESPONSE) },
      ]

      // Display in UI
      const displayText = parsed.analyse || parsed.resume_situation || ''
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: displayText, parsed, isInitial },
      ])
    } catch (err) {
      if (err.name === 'AbortError') return
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

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[560px] flex-col overflow-hidden rounded-2xl border border-[#bccac1]/40 bg-[#f5fbf5] shadow-lg">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 border-b border-[#dee4de] bg-white px-5 py-4">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#00694c] text-white shadow">
          <BrainCircuit size={22} />
        </div>
        <div>
          <h2 className="font-bold text-[#171d1a]">MediAssist</h2>
          <p className="text-xs text-[#6d7a73]">Assistant médical IA — Propulsé par MedGemma 1.5</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-[#d1fae5] px-3 py-1 text-xs font-semibold text-[#065f46]">
          <CheckCircle2 size={12} />
          En ligne
        </span>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {/* Welcome message */}
        {messages.length === 0 && !isLoading && (
          <AssistantBubble content="Bonjour ! J'analyse vos indicateurs de santé..." />
        )}

        {messages.map((msg, i) => {
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

        {isLoading && <ThinkingBubble />}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="border-t border-[#dee4de] bg-white px-4 py-3">
        <div className="flex items-end gap-3">
          <textarea
            className="flex-1 resize-none rounded-xl border border-[#bccac1] bg-[#f5fbf5] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#008560] focus:ring-2 focus:ring-[#008560]/20 disabled:opacity-50"
            disabled={isLoading}
            maxLength={600}
            placeholder="Posez une question à MediAssist..."
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
