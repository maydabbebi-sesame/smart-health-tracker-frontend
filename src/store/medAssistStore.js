import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── ID generation ─────────────────────────────────────────────────────────────
let seq = 0
function makeId(prefix) {
  seq += 1
  return `${prefix}-${Date.now()}-${seq}`
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const VALID_PRIORITES = new Set(['haute', 'moyenne', 'basse'])

// When the model omits or misspells "priorite", infer from list position so
// the most impactful recommendation (first) always gets the highest badge.
function normalizePriorite(value, index) {
  if (VALID_PRIORITES.has(value)) return value
  if (index === 0) return 'haute'
  if (index === 1) return 'moyenne'
  return 'basse'
}

const VALID_URGENCES = new Set(['normale', 'moderee', 'elevee', 'critique'])
function normalizeUrgence(value, fallback) {
  return VALID_URGENCES.has(value) ? value : (fallback || 'normale')
}

// ── Store ─────────────────────────────────────────────────────────────────────
// Holds everything MediAssist produces from a structured LLM analysis (see
// features/chatbot/MediAssistChat.jsx, which parses the model's JSON response
// and calls applyAnalysis). Recommendations power the AI Recommendations page,
// alerts power the Alerts center — both stay in sync across the app and
// survive reloads, exactly like the existing theme store.
export const useMedAssistStore = create(
  persist(
    (set) => ({
      recommendations: [],
      alerts: [],
      // True when `recommendations` was populated from past, persisted
      // recommendations (see loadFallbackRecommendations) rather than the
      // current session's own analysis — lets the AI Analysis page tell the
      // patient these aren't fresh (see MediAssistChat's use of
      // getRecommendationsHistory when the live LLM call fails).
      recommendationsAreFallback: false,

      // Last orientation suggested by MediAssist ({ niveau, specialite, raison,
      // delai }) — drives the Doctor Agent page's "should I suggest a doctor?"
      // heuristic without re-parsing the chat history.
      lastOrientation: null,

      // Last submitted symptom-form payload — persisted so the AI Recommendations
      // page (and its chat) survives navigating away and back via the sidebar,
      // which doesn't carry React Router's location.state.
      patientData: null,

      setPatientData(patientData) {
        set({ patientData })
      },

      // Called by the symptom form on every submission — clears all prior
      // analysis state so a fresh form run always triggers a new analysis,
      // even when the patient data hasn't changed.
      resetSession() {
        set({ chatMessages: [], chatHistory: [], chatSessionKey: null, recommendations: [], alerts: [], lastOrientation: null, recommendationsAreFallback: false })
      },

      // Chat conversation — persisted so leaving the AI Recommendations page
      // and coming back resumes the same discussion instead of starting over.
      // chatSessionKey fingerprints the patientData a conversation belongs to:
      // a fresh form submission gets a fresh conversation, but revisiting the
      // same analysis (e.g. via the browser back button) resumes it.
      chatMessages: [],
      chatHistory: [],
      chatSessionKey: null,
      chatSessionId: null,

      // Returns whether this call actually claimed a *new* session (true) or
      // found the session already current (false) and left state untouched.
      // The check-and-set happens inside `set`'s synchronous updater, so it's
      // atomic — two mounts racing to start the same session (StrictMode's
      // double-invoke, a lazy/Suspense replay, ...) can't both win, which is
      // what a component-local ref alone can't guarantee.
      startChatSession(sessionKey) {
        let claimed = false
        set((state) => {
          if (state.chatSessionKey === sessionKey) return state
          claimed = true
          return {
            chatMessages: [],
            chatHistory: [],
            chatSessionKey: sessionKey,
            // Unique ID per consultation — backend uses (user_uid, sessionId) to
            // scope history so a new form submission never inherits past turns.
            chatSessionId: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            recommendations: [],
            alerts: [],
            lastOrientation: null,
            recommendationsAreFallback: false,
          }
        })
        return claimed
      },

      setChatMessages(updater) {
        set((state) => ({
          chatMessages: typeof updater === 'function' ? updater(state.chatMessages) : updater,
        }))
      },

      appendChatHistory(entries) {
        set((state) => ({ chatHistory: [...state.chatHistory, ...entries] }))
      },

      // ── Turn a parsed MediAssist analysis into app state ─────────────────────
      applyAnalysis(parsed) {
        if (!parsed) return
        const now = new Date().toISOString()

        set((state) => {
          const knownTitles = new Set(
            state.recommendations.map((r) => r.titre.trim().toLowerCase()),
          )
          const filteredRecs = (parsed.recommandations || [])
            .filter((r) => r?.titre && !knownTitles.has(r.titre.trim().toLowerCase()))
          const newRecommendations = filteredRecs.map((r, i) => ({
            id: makeId('rec'),
            titre: r.titre,
            detail: r.detail || '',
            pourquoi: r.pourquoi || '',
            priorite: normalizePriorite(r.priorite, i),
            urgence: normalizeUrgence(parsed.urgence),
            createdAt: now,
            done: false,
          }))

          // alertes can be strings (legacy) or objects {titre, detail, action}
          const knownAlerts = new Set(
            state.alerts.map((a) => (a.titre || a.text || '').trim().toLowerCase()),
          )
          const newAlerts = (parsed.alertes || [])
            .filter((a) => {
              if (!a) return false
              const key = typeof a === 'string' ? a : (a.titre || a.detail || '')
              return key && !knownAlerts.has(key.trim().toLowerCase())
            })
            .map((a) => {
              if (typeof a === 'string') {
                return { id: makeId('alert'), titre: a, text: null, action: null, urgence: normalizeUrgence(parsed.urgence), createdAt: now, read: false }
              }
              return {
                id: makeId('alert'),
                titre: a.titre || '',
                text: a.detail || '',
                action: a.action || '',
                // Per-alert urgence (from model) takes priority over global urgence
                urgence: normalizeUrgence(a.urgence, parsed.urgence),
                createdAt: now,
                read: false,
              }
            })

          return {
            recommendations: [...newRecommendations, ...state.recommendations],
            alerts: [...newAlerts, ...state.alerts],
            lastOrientation: parsed.orientation || state.lastOrientation,
          }
        })
      },

      // Called by MediAssistChat after an initial analysis whose LLM call
      // failed (gateway unreachable/timeout) and therefore produced no
      // recommandations — backs the panel with the patient's last persisted
      // recommendations (see services/mediAssistService.getRecommendationsHistory)
      // instead of leaving it empty. Only applies if nothing real landed first.
      loadFallbackRecommendations(history) {
        set((state) => {
          if (state.recommendations.length > 0 || !history?.length) return state
          return {
            recommendations: history.map((r) => ({
              id: makeId('rec'),
              titre: r.titre,
              detail: r.detail || '',
              pourquoi: r.pourquoi || '',
              priorite: normalizePriorite(r.priorite),
              urgence: normalizeUrgence(r.urgence),
              createdAt: r.createdAt || new Date().toISOString(),
              done: false,
            })),
            recommendationsAreFallback: true,
          }
        })
      },

      toggleRecommendationDone(id) {
        set((state) => ({
          recommendations: state.recommendations.map((r) =>
            r.id === id ? { ...r, done: !r.done } : r,
          ),
        }))
      },

      markAlertRead(id) {
        set((state) => ({
          alerts: state.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
        }))
      },

      dismissAlert(id) {
        set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) }))
      },
    }),
    {
      name: 'smart-health-mediassist',
    },
  ),
)
