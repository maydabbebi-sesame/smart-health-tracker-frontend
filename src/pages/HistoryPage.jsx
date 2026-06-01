import { useQuery } from '@tanstack/react-query'
import { CalendarDays, FileText, HeartPulse } from 'lucide-react'

import { getHealthHistory } from '../services/healthHistoryService'
import { LoadingSkeleton } from '../shared/ui/LoadingSkeleton'

function HistoryPage() {
  const { data: records, isLoading } = useQuery({
    queryKey: ['health-history'],
    queryFn: getHealthHistory,
  })

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">Health History</h1>
            <p className="mt-1 text-sm text-slate-600">Your recent health records, notes, and trends.</p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-teal-700">
            <HeartPulse size={24} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3">
          {records.map((record) => (
            <div
              key={record.title}
              className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-teal-700">
                <FileText size={19} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-950">{record.title}</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <CalendarDays size={15} />
                  {record.date}
                </p>
              </div>
              <span className="w-fit rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                {record.type}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default HistoryPage
