// ── MediAssist client ─────────────────────────────────────────────────────────
// Sends one chat turn (patient profile + running history + the new question)
// to the Python backend (mediassist_service/app.py), which builds the system
// and user prompts, calls the LLM and parses its JSON reply. Keeping the
// prompt-building and the gateway call server-side means the API key never
// reaches the browser — the frontend only ever sees the parsed result.
const MEDIASSIST_BASE_URL = import.meta.env.VITE_MEDIASSIST_URL || 'http://127.0.0.1:5001'
const CHAT_ENDPOINT = `${MEDIASSIST_BASE_URL}/api/mediassist/chat`
const DOCTOR_AGENT_ENDPOINT = `${MEDIASSIST_BASE_URL}/api/mediassist/doctor-agent`
const ANALYZE_TRENDS_ENDPOINT = `${MEDIASSIST_BASE_URL}/api/mediassist/analyze-trends`
// Must stay comfortably ABOVE the backend's own gateway-call timeout
// (mediassist_service/llm_client.py's TIMEOUT_S) — medgemma1.5 is a "thinking"
// model whose generation routinely runs past a minute, and aborting here
// before the backend's call returns means the turn never gets logged either.
const TIMEOUT_MS = 520_000
// The doctor-agent decision uses a lighter general-purpose model reasoning
// over already-distilled signals (see mediassist_service/app.py), so it
// should resolve much faster than a full MediAssist analysis — but still
// give it a generous budget since LLM latency varies.
const DOCTOR_AGENT_TIMEOUT_MS = 120_000

export async function sendMediAssistMessage({ patientData, history, userText, userUid, sessionId, signal }) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const resp = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientData, history, userText, userUid, sessionId }),
      signal: signal || controller.signal,
    })

    if (!resp.ok) throw new Error(`Erreur du service MediAssist : ${resp.status}`)

    const { userContent, assistantContent, parsed, error } = await resp.json()
    if (error && !parsed) throw new Error(error)

    return { userContent, assistantContent, parsed }
  } catch (err) {
    if (err.name === 'AbortError') throw new Error("L'analyse a dépassé le délai imparti. Réessayez.", { cause: err })
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

// Asks the Doctor Agent's decision endpoint whether to proactively offer to
// find a doctor right now, given signals MediAssist already produced (alerts,
// recommendations, orientation) — see mediassist_service/app.py's
// doctor_agent_decision route. Never throws on a backend/LLM failure: the
// caller falls back to its own local heuristic instead, so a gateway outage
// never blocks the Doctor Agent page.
export async function getDoctorAgentDecision({ alerts, recommendations, orientation }) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), DOCTOR_AGENT_TIMEOUT_MS)

  try {
    const resp = await fetch(DOCTOR_AGENT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alerts, recommendations, orientation }),
      signal: controller.signal,
    })

    if (!resp.ok) throw new Error(`Erreur du service Agent Médecin : ${resp.status}`)

    const decision = await resp.json()
    return { success: true, decision }
  } catch (err) {
    return { success: false, error: err.message || "Le service Agent Médecin est indisponible." }
  } finally {
    clearTimeout(timeoutId)
  }
}

// Analyzes how a patient's vitals/symptoms evolved over a chosen period
// (week/month/3months) for the health-history page's "Analyser mes
// tendances" button. Reasons over raw longitudinal data, so it uses the same
// generous timeout as the main chat — not the lighter Doctor Agent budget.
export async function getTrendsAnalysis({ vitals, period }) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const resp = await fetch(ANALYZE_TRENDS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vitals, period }),
      signal: controller.signal,
    })

    if (!resp.ok) throw new Error(`Erreur du service d'analyse de tendances : ${resp.status}`)

    const analysis = await resp.json()
    if (analysis.error && !analysis.synthese) throw new Error(analysis.error)

    return { success: true, analysis }
  } catch (err) {
    if (err.name === 'AbortError') {
      return { success: false, error: "L'analyse a dépassé le délai imparti. Réessayez." }
    }
    return { success: false, error: err.message || "Le service d'analyse de tendances est indisponible." }
  } finally {
    clearTimeout(timeoutId)
  }
}
