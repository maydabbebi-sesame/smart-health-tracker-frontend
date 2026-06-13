// ── MediAssist client ─────────────────────────────────────────────────────────
// Sends one chat turn (patient profile + running history + the new question)
// to the Python backend (mediassist_service/app.py), which builds the system
// and user prompts, calls the LLM and parses its JSON reply. Keeping the
// prompt-building and the gateway call server-side means the API key never
// reaches the browser — the frontend only ever sees the parsed result.
const CHAT_ENDPOINT = import.meta.env.VITE_MEDIASSIST_URL
  ? `${import.meta.env.VITE_MEDIASSIST_URL}/api/mediassist/chat`
  : 'http://127.0.0.1:5001/api/mediassist/chat'
// Must stay comfortably ABOVE the backend's own gateway-call timeout
// (mediassist_service/llm_client.py's TIMEOUT_S) — medgemma1.5 is a "thinking"
// model whose generation routinely runs past a minute, and aborting here
// before the backend's call returns means the turn never gets logged either.
const TIMEOUT_MS = 520_000

export async function sendMediAssistMessage({ patientData, history, userText, signal }) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const resp = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientData, history, userText }),
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
