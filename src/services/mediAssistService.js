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
const RECOMMENDATIONS_ENDPOINT = `${MEDIASSIST_BASE_URL}/api/mediassist/recommendations`
const RECOMMENDATIONS_HISTORY_ENDPOINT = `${MEDIASSIST_BASE_URL}/api/mediassist/recommendations-history`
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
// The recommendations lookup is a plain DB read (no LLM call), so it should
// resolve almost instantly — a short budget keeps a stalled DB from hanging
// the dashboard.
const RECOMMENDATIONS_TIMEOUT_MS = 10_000

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

    // error can be set alongside a non-null `parsed` — the backend still
    // returns a usable (but generic, recommendation-less) fallback object so
    // the chat bubble always has something to render; surfacing error too
    // lets the caller tell "the model genuinely found nothing to recommend"
    // apart from "the LLM gateway call failed" (see AI Analysis page's
    // history fallback in MediAssistChat.jsx).
    return { userContent, assistantContent, parsed, error }
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

// Fetches the dashboard's "Recommandation IA" card content: the top-priority
// recommendation from the patient's most recent MediAssist analysis, already
// stored in mediassist_history — see app.py's latest_recommendation route.
// No LLM call, so it stays fast enough to load alongside the rest of the
// dashboard.
export async function getLatestRecommendation({ userUid }) {
  if (!userUid) return { success: false, error: 'Utilisateur non identifié.' }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), RECOMMENDATIONS_TIMEOUT_MS)

  try {
    const resp = await fetch(`${RECOMMENDATIONS_ENDPOINT}?user_uid=${encodeURIComponent(userUid)}`, {
      signal: controller.signal,
    })

    if (!resp.ok) throw new Error(`Erreur du service MediAssist : ${resp.status}`)

    const { summary, recommendation, error } = await resp.json()
    if (error) throw new Error(error)

    return { success: true, summary, recommendation }
  } catch (err) {
    return { success: false, error: err.message || 'Le service de recommandations est indisponible.' }
  } finally {
    clearTimeout(timeoutId)
  }
}

// Fallback for the AI Analysis page: when the initial analysis turn's LLM
// call fails, the chat response falls back to a generic, recommendation-less
// object (see llm_client.FALLBACK_RESPONSE) — the recommendations panel would
// otherwise go empty even though MediAssist successfully produced real
// recommendations in a previous session. Returns the patient's last
// persisted recommendations (see app.py's recommendations_history route).
export async function getRecommendationsHistory({ userUid }) {
  if (!userUid) return { success: false, error: 'Utilisateur non identifié.' }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), RECOMMENDATIONS_TIMEOUT_MS)

  try {
    const resp = await fetch(`${RECOMMENDATIONS_HISTORY_ENDPOINT}?user_uid=${encodeURIComponent(userUid)}`, {
      signal: controller.signal,
    })

    if (!resp.ok) throw new Error(`Erreur du service MediAssist : ${resp.status}`)

    const { recommendations, error } = await resp.json()
    if (error) throw new Error(error)

    return { success: true, recommendations: recommendations || [] }
  } catch (err) {
    return { success: false, error: err.message || "L'historique des recommandations est indisponible." }
  } finally {
    clearTimeout(timeoutId)
  }
}
