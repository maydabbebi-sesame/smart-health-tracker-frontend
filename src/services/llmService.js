const LLM_ENDPOINT = '/llm/api/chat'
const API_KEY = 'sk-64c932a912b64339928b35feea0c45e1'
const MODEL = 'medgemma1.5:latest'
const TIMEOUT_MS = 90_000

// ── API call ──────────────────────────────────────────────────────────────────
export async function callMediAssist(messages, abortSignal) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const signal = abortSignal || controller.signal

  try {
    const resp = await fetch(LLM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 3500,
          num_ctx: 8192,
        },
        messages,
      }),
      signal,
    })

    clearTimeout(timeoutId)

    if (resp.status === 401) throw new Error('Clé API invalide.')
    if (resp.status === 403) throw new Error('Accès refusé au gateway LLM.')
    if (!resp.ok) throw new Error(`Erreur gateway LLM : ${resp.status}`)

    const data = await resp.json()

    // Support Ollama native + OpenAI-compatible (FocusLLMVerse)
    let raw = ''
    if (data.choices) {
      const msg = data.choices[0]?.message || {}
      raw = msg.content || ''
      if (!raw.trim()) {
        const reasoning = msg.reasoning || ''
        const m = reasoning.match(/\{[\s\S]*\}/)
        if (m) raw = m[0]
      }
    } else if (data.message) {
      raw = data.message.content || ''
      if (!raw.trim()) {
        const thinking = data.message.thinking || ''
        const m = thinking.match(/\{[\s\S]*\}/)
        if (m) raw = m[0]
      }
    }

    return raw
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') throw new Error("L'analyse a dépassé le délai imparti. Réessayez.")
    throw err
  }
}

// ── JSON parser (mirrors eval_llm.py logic) ───────────────────────────────────
export function parseResponse(raw) {
  if (!raw?.trim()) return null

  // Direct parse
  try { return JSON.parse(raw.trim()) } catch {}

  // After sanitizing control chars
  try {
    const cleaned = raw
      .replace(/\t/g, '\\t')
      .replace(/\r/g, '\\r')
      .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
    return JSON.parse(cleaned.trim())
  } catch {}

  // Regex extraction
  const m = raw.match(/\{[\s\S]*\}/)
  if (m) {
    try { return JSON.parse(m[0]) } catch {}
  }

  return null
}

// ── Static fallback when parsing fails ───────────────────────────────────────
export const FALLBACK_RESPONSE = {
  urgence: 'moderee',
  alertes: [],
  resume_situation: 'Analyse temporairement indisponible.',
  analyse: "Nous n'avons pas pu analyser vos données correctement. Veuillez réessayer.",
  recommandations: [],
  orientation: {
    niveau: 'medecin_generaliste',
    raison: 'En cas de doute, consultez votre médecin.',
    delai: 'cette semaine',
  },
  disclaimer: 'Ces informations sont indicatives et ne remplacent pas une consultation médicale.',
}
