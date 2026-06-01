import { useQuery } from '@tanstack/react-query'
import { Bell, CheckCircle2 } from 'lucide-react'

import { getNotifications } from '../services/notificationService'
import { LoadingSkeleton } from '../shared/ui/LoadingSkeleton'

function NotificationsPage() {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  })

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Notifications</h1>
          <p className="mt-1 text-sm text-slate-600">Health alerts, reminders, and AI insight updates.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700">
          <Bell size={16} />
          {notifications.length} updates
        </span>
      </div>

      <section className="space-y-3">
        {notifications.map((notification) => (
          <article
            key={notification.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-50 text-cyan-700">
              <CheckCircle2 size={19} />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-slate-950">{notification.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{notification.text}</p>
            </div>
            <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {notification.status}
            </span>
          </article>
        ))}
      </section>
    </div>
  )
}

export default NotificationsPage
