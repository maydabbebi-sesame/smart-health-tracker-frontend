import {
  Activity,
  AlertTriangle,
  Apple,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  Droplet,
  Gauge,
  Moon,
  Pill,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { MediAssistChat } from '../features/chatbot/MediAssistChat'
import { useMedAssistStore } from '../store/medAssistStore'
import { formatRelativeTime } from '../utils/time'

// ── Priority → visual language (mirrors the badge/border/icon vocabulary used
// across the app, e.g. NotificationsPage's alertStyles, for a coherent look) ──
const PRIORITY_THEME = {
  haute:   { badge: 'URGENT',     badgeClass: 'bg-[#ba1a1a] text-white', border: 'border-l-[#ba1a1a]', iconBox: 'bg-[#ffdad6] text-[#ba1a1a]' },
  moyenne: { badge: 'IMPORTANT',  badgeClass: 'bg-[#0060a8] text-white', border: 'border-l-[#0060a8]', iconBox: 'bg-[#d2e4ff] text-[#0060a8]' },
  basse:   { badge: 'INFORMATIF', badgeClass: 'bg-[#00694c] text-white', border: 'border-l-[#00694c]', iconBox: 'bg-[#86f8c9]/40 text-[#00694c]' },
}

const URGENCE_LABELS = {
  normale:  'Normale',
  moderee:  'Modérée',
  elevee:   'Élevée',
  critique: 'Critique',
}

// Static lookup table — keeps icon components declared at module scope
// (mirrors the alertStyles[status].icon convention used on the Alerts page).
const CATEGORY_ICONS = {
  hydratation: Droplet,
  cardio: Activity,
  sommeil: Moon,
  nutrition: Apple,
  tension: Gauge,
  medicament: Pill,
  general: Sparkles,
}

// ── Pick a representative category from the recommendation's title/detail ────
function pickCategory(rec) {
  const text = `${rec.titre} ${rec.detail}`.toLowerCase()
  if (/hydrat|eau|boisson|deshydrat/.test(text)) return 'hydratation'
  if (/cardi|coeur|cœur|frequence cardiaque|fréquence cardiaque|recuperation|récupération/.test(text)) return 'cardio'
  if (/sommeil|dormir|nuit|repos/.test(text)) return 'sommeil'
  if (/vitamin|nutrition|aliment|repas|complement|complément|regime|régime/.test(text)) return 'nutrition'
  if (/tension|pression arterielle|pression artérielle/.test(text)) return 'tension'
  if (/medicament|médicament|traitement|posologie/.test(text)) return 'medicament'
  return 'general'
}

// ── Alert severity → visual language ─────────────────────────────────────────
const ALERT_THEME = {
  critique: { label: 'Critique', border: 'border-l-[#93000a]', Icon: AlertTriangle, iconBox: 'bg-[#ffdad6] text-[#93000a]', badge: 'bg-[#93000a] text-white' },
  elevee:   { label: 'Élevée',   border: 'border-l-[#ba1a1a]', Icon: AlertTriangle, iconBox: 'bg-[#ffdad6] text-[#ba1a1a]', badge: 'bg-[#ba1a1a] text-white' },
  moderee:  { label: 'Modérée',  border: 'border-l-[#9a6700]', Icon: Clock,         iconBox: 'bg-[#fef3c7] text-[#9a6700]', badge: 'bg-[#9a6700] text-white' },
  normale:  { label: 'Normale',  border: 'border-l-[#00694c]', Icon: CheckCircle2,  iconBox: 'bg-[#86f8c9]/40 text-[#00694c]', badge: 'bg-[#008560] text-white' },
}

function AlertItem({ alert }) {
  const [expanded, setExpanded] = useState(false)
  const theme = ALERT_THEME[alert.urgence] || ALERT_THEME.moderee
  const { Icon } = theme
  const markRead = useMedAssistStore((s) => s.markAlertRead)
  const dismiss = useMedAssistStore((s) => s.dismissAlert)

  return (
    <article className={`sht-card overflow-hidden border-l-[6px] ${theme.border} ${alert.read ? 'opacity-60' : ''}`}>
      <div className="flex gap-4 p-5">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${theme.iconBox}`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${theme.badge}`}>
              {theme.label}
            </span>
            {!alert.read && <span className="h-2 w-2 rounded-full bg-[#ba1a1a]" title="Non lu" />}
            <span className="ml-auto text-xs text-[#6d7a73]">{formatRelativeTime(alert.createdAt)}</span>
          </div>
          <h3 className="mt-2 font-semibold text-[#171d1a] dark:text-white">{alert.titre}</h3>
          {alert.text && (
            <p className="mt-1 text-sm leading-6 text-[#3d4943]">{alert.text}</p>
          )}
          {expanded && alert.action && (
            <div className="mt-2 rounded-lg border border-[#dee4de] bg-[#f5fbf5] p-3 text-sm text-[#3d4943]">
              <span className="font-semibold">Action recommandée : </span>{alert.action}
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-3">
            {alert.action && (
              <button
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#e4eae4] px-3 py-1.5 text-xs font-medium text-[#3d4943] transition hover:bg-[#dee4de]"
                type="button"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {expanded ? 'Masquer' : 'Que faire ?'}
              </button>
            )}
            {!alert.read && (
              <button
                className="rounded-lg bg-[#00694c] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#008560]"
                type="button"
                onClick={() => markRead(alert.id)}
              >
                Marquer comme lu
              </button>
            )}
            <button
              className="rounded-lg bg-[#e4eae4] px-3 py-1.5 text-xs font-medium text-[#3d4943] transition hover:bg-[#dee4de]"
              type="button"
              onClick={() => dismiss(alert.id)}
            >
              Ignorer
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

// ── Recommendation card ───────────────────────────────────────────────────────
function RecommendationCard({ rec }) {
  const [expanded, setExpanded] = useState(false)
  const toggleDone = useMedAssistStore((s) => s.toggleRecommendationDone)
  const theme = PRIORITY_THEME[rec.priorite] || PRIORITY_THEME.basse
  const Icon = CATEGORY_ICONS[pickCategory(rec)] || CATEGORY_ICONS.general

  return (
    <article
      className={`sht-card overflow-hidden border-l-[6px] ${theme.border} transition ${rec.done ? 'opacity-60' : ''}`}
    >
      <div className="flex gap-4 p-5">
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${theme.iconBox}`}>
          <Icon size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${theme.badgeClass}`}>
              {theme.badge}
            </span>
            <h3 className={`font-semibold text-[#171d1a] dark:text-white ${rec.done ? 'line-through' : ''}`}>
              {rec.titre}
            </h3>
            <span className="ml-auto whitespace-nowrap text-xs text-[#6d7a73]">{formatRelativeTime(rec.createdAt)}</span>
          </div>
          <p className="mt-1.5 text-sm leading-6 text-[#3d4943]">{rec.detail}</p>

          {expanded && (
            <div className="mt-3 space-y-1.5 rounded-lg border border-[#dee4de] bg-[#f5fbf5] p-3 text-xs leading-5 text-[#3d4943]">
              {rec.pourquoi && (
                <p>
                  <span className="font-semibold">Pourquoi cette recommandation : </span>
                  {rec.pourquoi}
                </p>
              )}
              <p>
                <span className="font-semibold">Niveau d'urgence au moment de l'analyse : </span>
                {URGENCE_LABELS[rec.urgence] || rec.urgence}
              </p>
              <p>
                <span className="font-semibold">Priorité : </span>
                {theme.badge.charAt(0) + theme.badge.slice(1).toLowerCase()}
              </p>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-3">
            <button
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#00694c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#008560]"
              type="button"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              Voir détails
            </button>
            <button
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                rec.done
                  ? 'bg-[#86f8c9]/40 text-[#00694c]'
                  : 'bg-[#e4eae4] text-[#3d4943] hover:bg-[#dee4de]'
              }`}
              type="button"
              onClick={() => toggleDone(rec.id)}
            >
              {rec.done ? '✓ Fait' : 'Marquer comme fait'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function EmptyRecommendations() {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#bccac1] bg-white/60 px-8 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#e4eae4] text-[#3d4943]">
        <Sparkles size={28} />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[#171d1a] dark:text-white">Aucune recommandation pour le moment</h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-[#6d7a73]">
          MediAssist analyse vos indicateurs de santé. Vos recommandations personnalisées
          apparaîtront ici dès que l'analyse sera prête.
        </p>
      </div>
    </div>
  )
}

function AIAnalysisPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const storedPatientData = useMedAssistStore((s) => s.patientData)
  const patientData = location.state?.patientData ?? storedPatientData
  const recommendations = useMedAssistStore((s) => s.recommendations)
  const alerts = useMedAssistStore((s) => s.alerts)
  const [alertsOpen, setAlertsOpen] = useState(true)
  const [recsOpen, setRecsOpen] = useState(true)

  if (!patientData) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#e4eae4] text-[#3d4943]">
          <ClipboardList size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[#171d1a] dark:text-white">
            Aucune donnée patient disponible
          </h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-[#6d7a73]">
            Pour consulter MediAssist, veuillez d'abord renseigner vos indicateurs de santé
            dans le formulaire de symptômes.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl bg-[#00694c] px-6 py-3 text-sm font-bold text-white shadow transition hover:bg-[#008560]"
          type="button"
          onClick={() => navigate('/symptoms')}
        >
          <ClipboardList size={18} />
          Remplir le formulaire
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight text-[#171d1a] dark:text-white">
            Recommandations Personnalisées
          </h1>
          <p className="mt-1 text-sm text-[#6d7a73]">
            Analyse de vos données de santé en temps réel.
          </p>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-full bg-[#008560] px-4 py-2 text-sm font-semibold text-white shadow-sm">
          <BrainCircuit size={18} />
          Propulsé par l'IA MediAssist
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_minmax(360px,420px)]">
        <section aria-label="Analyse" className="space-y-6">
          {alerts.length > 0 && (
            <div className="space-y-3">
              <button
                className="flex w-full items-center gap-2 text-left"
                type="button"
                onClick={() => setAlertsOpen((v) => !v)}
              >
                <AlertTriangle size={15} className="text-[#ba1a1a]" />
                <span className="text-sm font-semibold uppercase tracking-wide text-[#ba1a1a]">
                  Alertes détectées ({alerts.length})
                </span>
                <span className="ml-auto text-[#ba1a1a]">
                  {alertsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>
              {alertsOpen && alerts.map((alert) => (
                <AlertItem alert={alert} key={alert.id} />
              ))}
            </div>
          )}

          <div className="space-y-4">
            <button
              className="flex w-full items-center gap-2 text-left"
              type="button"
              onClick={() => setRecsOpen((v) => !v)}
            >
              <Sparkles size={15} className="text-[#3d4943]" />
              <span className="text-sm font-semibold uppercase tracking-wide text-[#3d4943]">
                Recommandations ({recommendations.length})
              </span>
              <span className="ml-auto text-[#3d4943]">
                {recsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>
            {recsOpen && (
              recommendations.length === 0 ? (
                <EmptyRecommendations />
              ) : (
                recommendations.map((rec) => <RecommendationCard key={rec.id} rec={rec} />)
              )
            )}
          </div>
        </section>

        {/* Keyed by the patient-data fingerprint: a fresh form submission
            gets a fresh chat session (and remounts the component so its
            mount effect runs again), while returning to the same analysis
            keeps the same instance and resumes the persisted conversation. */}
        <MediAssistChat key={JSON.stringify(patientData)} patientData={patientData} />
      </div>
    </div>
  )
}

export default AIAnalysisPage
