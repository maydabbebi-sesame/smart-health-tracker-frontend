import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Bell, BrainCircuit, Clock, Info, ShieldCheck } from 'lucide-react'

import { getNotifications } from '../services/notificationService'
import { LoadingSkeleton } from '../shared/ui/LoadingSkeleton'

const alertStyles = {
  Insight: {
    border: 'border-l-[#0060a8]',
    icon: Info,
    iconBox: 'bg-[#d2e4ff] text-[#0060a8]',
    badge: 'bg-[#0060a8] text-white',
  },
  New: {
    border: 'border-l-[#ba1a1a]',
    icon: AlertTriangle,
    iconBox: 'bg-[#ffdad6] text-[#ba1a1a]',
    badge: 'bg-[#ba1a1a] text-white',
  },
  Today: {
    border: 'border-l-[#00694c]',
    icon: Clock,
    iconBox: 'bg-[#86f8c9]/40 text-[#00694c]',
    badge: 'bg-[#008560] text-white',
  },
}

function NotificationsPage() {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  })

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="text-[32px] font-semibold leading-tight text-[#171d1a] dark:text-white">Centre d'Alertes</h1>
          <p className="mt-2 text-base leading-7 text-[#6d7a73]">Gerez vos notifications de sante en temps reel.</p>
        </div>

        <div className="flex w-fit rounded-lg bg-[#eaefea] p-1">
          {['Toutes', 'Critiques', 'Non lues'].map((filter, index) => (
            <button
              className={`rounded-md px-5 py-2 text-sm font-medium transition ${
                index === 0
                  ? 'bg-white text-[#00694c] shadow-[0_2px_12px_rgba(0,0,0,0.06)]'
                  : 'text-[#6d7a73] hover:text-[#171d1a]'
              }`}
              key={filter}
              type="button"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <section className="space-y-6">
        {notifications.map((notification) => {
          const style = alertStyles[notification.status] || alertStyles.Today
          const AlertIcon = style.icon

          return (
            <article
              className={`sht-card overflow-hidden border-l-[6px] ${style.border}`}
              key={notification.id}
            >
              <div className="flex flex-col gap-5 p-6 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-6">
                  <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${style.iconBox}`}>
                    <AlertIcon size={24} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${style.badge}`}>
                        {notification.status}
                      </span>
                      <h2 className="text-xl font-semibold text-[#171d1a] dark:text-white">{notification.title}</h2>
                    </div>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[#3d4943]">{notification.text}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-[#6d7a73]">Il y a 2 h</span>
              </div>
              <div className="flex flex-wrap gap-3 border-t border-[#bccac1]/30 px-6 py-4">
                <button className="rounded-lg bg-[#00694c] px-4 py-2 text-sm font-semibold text-white" type="button">
                  Voir details
                </button>
                <button className="rounded-lg bg-[#e4eae4] px-4 py-2 text-sm font-medium text-[#3d4943]" type="button">
                  Marquer comme lu
                </button>
              </div>
            </article>
          )
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <article className="sht-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="sht-kicker">AI Analysis</p>
              <h2 className="mt-2 text-xl font-semibold text-[#171d1a] dark:text-white">Analyse predictive</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#3d4943]">
                Le moteur IA frontend simule une detection de signaux inhabituels a partir des entrees symptomes,
                notifications et historique patient. La version backend remplacera ces mocks par des endpoints reels.
              </p>
            </div>
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#86f8c9]/35 text-[#00694c]">
              <BrainCircuit size={24} />
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              { label: 'Risque detecte', value: 'Modere', tone: 'text-[#8a5a00] bg-[#fff3cd]' },
              { label: 'Confiance IA', value: '82%', tone: 'text-[#00694c] bg-[#86f8c9]/35' },
              { label: 'Action', value: 'Surveiller', tone: 'text-[#0060a8] bg-[#d2e4ff]' },
            ].map((item) => (
              <div className="rounded-lg border border-[#dce5df] bg-white p-4" key={item.label}>
                <p className="text-sm text-[#6d7a73]">{item.label}</p>
                <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.tone}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-dashed border-[#68dbae] bg-[#eff5ef] p-6">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-white text-[#00694c]">
            <ShieldCheck size={22} />
          </div>
          <h2 className="mt-4 font-semibold text-[#171d1a]">Backend-ready</h2>
          <p className="mt-2 text-sm leading-6 text-[#3d4943]">
            Les alertes sont mockees cote front. Le contrat d'integration est documente dans docs/api-contracts.md.
          </p>
        </article>
      </section>

      <div className="sht-card flex items-center gap-3 p-4 text-sm text-[#3d4943]">
        <Bell className="text-[#00694c]" size={19} />
        {notifications.length} alertes synchronisees depuis les mocks frontend. Les contrats backend restent dans
        docs/api-contracts.md.
      </div>
    </div>
  )
}

export default NotificationsPage
