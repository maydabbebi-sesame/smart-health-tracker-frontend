import { AlertTriangle, Bell, BrainCircuit, CheckCircle2, Clock, Info } from 'lucide-react'
import { useState } from 'react'

import { useMedAssistStore } from '../store/medAssistStore'
import { formatRelativeTime } from '../utils/time'

// ── Severity → visual language ────────────────────────────────────────────────
// Same vocabulary (left border + icon box + badge) as the recommendation cards
// on the AI Recommendations page, so both MediAssist-created surfaces feel
// like one coherent system rather than two different UIs bolted together.
const SEVERITY_THEME = {
  critique: { label: 'Critique', border: 'border-l-[#93000a]', icon: AlertTriangle, iconBox: 'bg-[#ffdad6] text-[#93000a]', badge: 'bg-[#93000a] text-white' },
  elevee:   { label: 'Élevée',   border: 'border-l-[#ba1a1a]', icon: AlertTriangle, iconBox: 'bg-[#ffdad6] text-[#ba1a1a]', badge: 'bg-[#ba1a1a] text-white' },
  moderee:  { label: 'Modérée',  border: 'border-l-[#9a6700]', icon: Clock,         iconBox: 'bg-[#fef3c7] text-[#9a6700]', badge: 'bg-[#9a6700] text-white' },
  normale:  { label: 'Normale',  border: 'border-l-[#00694c]', icon: CheckCircle2,  iconBox: 'bg-[#86f8c9]/40 text-[#00694c]', badge: 'bg-[#008560] text-white' },
  info:     { label: 'Info',     border: 'border-l-[#0060a8]', icon: Info,          iconBox: 'bg-[#d2e4ff] text-[#0060a8]', badge: 'bg-[#0060a8] text-white' },
}

const FILTERS = ['Toutes', 'Critiques', 'Non lues']

function isCritical(severity) {
  return severity === 'critique' || severity === 'elevee'
}

// ── Unified alert card ────────────────────────────────────────────────────────
function AlertCard({ alert, onPrimary, onSecondary }) {
  const theme = SEVERITY_THEME[alert.severity] || SEVERITY_THEME.info
  const Icon = theme.icon

  return (
    <article className={`sht-card overflow-hidden border-l-[6px] ${theme.border} ${alert.read ? 'opacity-70' : ''}`}>
      <div className="flex flex-col gap-5 p-6 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-6">
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${theme.iconBox}`}>
            <Icon size={24} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${theme.badge}`}>
                {theme.label}
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-[#86f8c9]/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#00694c]">
                <BrainCircuit size={11} />
                MediAssist
              </span>
              {!alert.read && (
                <span className="h-2 w-2 rounded-full bg-[#ba1a1a]" title="Non lu" />
              )}
              <h2 className="text-xl font-semibold text-[#171d1a] dark:text-white">{alert.title}</h2>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#3d4943]">{alert.text}</p>
          </div>
        </div>
        <span className="whitespace-nowrap text-xs font-medium text-[#6d7a73]">{alert.timestamp}</span>
      </div>
      <div className="flex flex-wrap gap-3 border-t border-[#bccac1]/30 px-6 py-4">
        <button className="rounded-lg bg-[#00694c] px-4 py-2 text-sm font-semibold text-white" type="button" onClick={onPrimary}>
          {alert.primaryLabel}
        </button>
        <button className="rounded-lg bg-[#e4eae4] px-4 py-2 text-sm font-medium text-[#3d4943]" type="button" onClick={onSecondary}>
          {alert.secondaryLabel}
        </button>
      </div>
    </article>
  )
}

function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState('Toutes')

  const mediAssistAlerts = useMedAssistStore((s) => s.alerts)
  const markAlertRead = useMedAssistStore((s) => s.markAlertRead)
  const dismissAlert = useMedAssistStore((s) => s.dismissAlert)

  // Every alert here comes from MediAssist's analyses — no more generic
  // placeholder notifications mixed in, so the center reflects only what
  // MediAssist actually detected for this patient.
  const alerts = mediAssistAlerts.map((a) => ({
    id: a.id,
    title: 'Alerte détectée par MediAssist',
    text: a.text,
    severity: a.urgence,
    timestamp: formatRelativeTime(a.createdAt),
    read: a.read,
    primaryLabel: 'Marquer comme lu',
    secondaryLabel: 'Ignorer',
    onPrimary: () => markAlertRead(a.id),
    onSecondary: () => dismissAlert(a.id),
  }))

  const filteredAlerts = alerts.filter((alert) => {
    if (activeFilter === 'Critiques') return isCritical(alert.severity)
    if (activeFilter === 'Non lues') return !alert.read
    return true
  })

  const unreadCount = alerts.filter((a) => !a.read).length

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="text-[32px] font-semibold leading-tight text-[#171d1a] dark:text-white">Centre d'Alertes</h1>
          <p className="mt-2 text-base leading-7 text-[#6d7a73]">Gérez vos notifications de santé en temps réel.</p>
        </div>

        <div className="flex w-fit rounded-lg bg-[#eaefea] p-1">
          {FILTERS.map((filter) => (
            <button
              className={`rounded-md px-5 py-2 text-sm font-medium transition ${
                activeFilter === filter
                  ? 'bg-white text-[#00694c] shadow-[0_2px_12px_rgba(0,0,0,0.06)]'
                  : 'text-[#6d7a73] hover:text-[#171d1a]'
              }`}
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <section className="space-y-6">
        {filteredAlerts.length === 0 ? (
          <div className="sht-card flex flex-col items-center gap-3 p-12 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e4eae4] text-[#3d4943]">
              <Bell size={24} />
            </div>
            <p className="text-sm text-[#6d7a73]">
              {activeFilter === 'Toutes'
                ? "Aucune alerte pour le moment. MediAssist en générera ici dès qu'une analyse détectera un point de vigilance."
                : 'Aucune alerte dans cette catégorie pour le moment.'}
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <AlertCard alert={alert} key={alert.id} onPrimary={alert.onPrimary} onSecondary={alert.onSecondary} />
          ))
        )}
      </section>

      <div className="sht-card flex flex-wrap items-center gap-3 p-4 text-sm text-[#3d4943]">
        <BrainCircuit className="text-[#00694c]" size={19} />
        <span>
          {alerts.length} alerte{alerts.length > 1 ? 's' : ''} générée{alerts.length > 1 ? 's' : ''} par MediAssist depuis vos analyses
        </span>
        <span className="text-[#bccac1]">•</span>
        <span>{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}

export default NotificationsPage
