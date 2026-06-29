import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Inbox,
  Stethoscope,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { getCurrentUser } from '../services/authService'
import { cancelAppointment, confirmAppointment, getAppointments } from '../services/appointmentsService'
import { NewAppointmentModal } from '../features/appointments/NewAppointmentModal'
import { LoadingSkeleton } from '../shared/ui/LoadingSkeleton'
import { useTranslation } from '../i18n/useTranslation'

const STATUS_STYLES = {
  scheduled: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  confirmed: 'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
  cancelled: 'bg-[#ffdad6] text-[#ba1a1a] dark:bg-rose-500/15 dark:text-rose-300',
  completed: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
}

function getStatusLabel(status, t) {
  if (status === 'confirmed') return t('appointments.status.confirmed', 'Confirmé')
  if (status === 'cancelled') return t('appointments.status.cancelled', 'Annulé')
  if (status === 'completed') return t('appointments.status.completed', 'Terminé')
  return t('appointments.status.scheduled', 'Planifié')
}

function appointmentDateTime(appointment) {
  return new Date(`${appointment.appointment_date}T${appointment.appointment_time || '00:00:00'}`)
}

function AppointmentsPage() {
  const { t, localeTag } = useTranslation()
  const queryClient = useQueryClient()
  const userUid = getCurrentUser()?.uid || null
  const [showNewAppointment, setShowNewAppointment] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', userUid],
    queryFn: () => getAppointments(1, 100, null, userUid),
    enabled: Boolean(userUid),
  })

  const appointments = data?.success ? data.data : []
  const appointmentsError = data?.success === false ? data.error : null

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['appointments', userUid] })
  }

  const { mutate: doConfirm, isPending: isConfirming } = useMutation({
    mutationFn: (uid) => confirmAppointment(uid),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(t('appointments.actions.confirmSuccess', 'Rendez-vous confirmé.'))
      invalidate()
    },
  })

  const { mutate: doCancel, isPending: isCancelling } = useMutation({
    mutationFn: (uid) => cancelAppointment(uid),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(t('appointments.actions.cancelSuccess', 'Rendez-vous annulé.'))
      invalidate()
    },
  })

  const sortedAppointments = [...appointments].sort((a, b) => appointmentDateTime(a) - appointmentDateTime(b))

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#00694c] via-[#00875f] to-[#0077b6] p-7 text-white shadow-lg shadow-[#00694c]/20">
        <CalendarCheck className="absolute -right-4 -top-4 h-40 w-40 text-white/10" strokeWidth={1.5} />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">{t('appointments.banner.eyebrow', 'Suivi médical')}</p>
        <h1 className="mt-2 text-[32px] font-bold leading-tight">{t('appointments.banner.title', 'Mes rendez-vous')}</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/85">
          {t('appointments.banner.subtitle', 'Retrouvez ici tous vos rendez-vous médicaux, à venir et passés.')}
        </p>
        <button
          className="relative mt-4 flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#00694c] shadow-md transition hover:bg-white/90"
          type="button"
          onClick={() => setShowNewAppointment(true)}
        >
          <CalendarPlus size={16} /> {t('appointments.newButton', 'Nouveau rendez-vous')}
        </button>
      </div>

      {showNewAppointment && (
        <NewAppointmentModal
          userUid={userUid}
          onClose={() => setShowNewAppointment(false)}
          onCreated={invalidate}
        />
      )}

      {appointmentsError ? (
        <section className="sht-card flex flex-col items-center gap-3 p-12 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-red-50 text-[#ba1a1a]">
            <AlertCircle size={28} />
          </div>
          <p className="font-semibold text-[#171d1a] dark:text-white">{t('appointments.error.title', 'Impossible de charger vos rendez-vous')}</p>
          <p className="max-w-md text-sm text-[#ba1a1a]">{appointmentsError}</p>
        </section>
      ) : sortedAppointments.length === 0 ? (
        <section className="sht-card flex flex-col items-center gap-3 p-12 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-[#eff5ef] text-[#00694c]">
            <Inbox size={28} />
          </div>
          <p className="font-semibold text-[#171d1a] dark:text-white">{t('appointments.empty.title', 'Aucun rendez-vous enregistré')}</p>
          <p className="max-w-md text-sm text-[#6d7a73]">
            {t('appointments.empty.subtitle', "Réservez un rendez-vous via l'Agent Médecin pour le voir apparaître ici.")}
          </p>
        </section>
      ) : (
        <div className="grid gap-4">
          {sortedAppointments.map((appointment) => {
            const doctor = { name: appointment.doctor_name, specialization: appointment.doctor_specialization }
            const isPast = appointmentDateTime(appointment) < new Date()
            const canConfirm = appointment.status === 'scheduled' && !isPast
            const canCancel = (appointment.status === 'scheduled' || appointment.status === 'confirmed') && !isPast

            return (
              <article className="sht-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between" key={appointment.uid}>
                <div className="flex gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#eff5ef] text-[#00694c]">
                    <Stethoscope size={22} />
                  </div>
                  <div>
                    <p className="font-semibold text-[#171d1a] dark:text-white">
                      {doctor?.name || appointment.reason || t('appointments.defaultReason', 'Rendez-vous médical')}
                    </p>
                    {doctor?.specialization && <p className="text-xs text-[#6d7a73]">{doctor.specialization}</p>}
                    {appointment.reason && doctor?.name && <p className="mt-1 text-sm text-[#3d4943]">{appointment.reason}</p>}
                    <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[#6d7a73]">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={14} />
                        {new Date(appointment.appointment_date).toLocaleDateString(localeTag, {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {appointment.appointment_time?.slice(0, 5)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[appointment.status] || STATUS_STYLES.scheduled}`}>
                    {getStatusLabel(appointment.status, t)}
                  </span>
                  {canConfirm && (
                    <button
                      className="flex items-center gap-1.5 rounded-lg bg-[#00694c] px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isConfirming}
                      type="button"
                      onClick={() => doConfirm(appointment.uid)}
                    >
                      <CheckCircle2 size={14} /> {t('appointments.actions.confirm', 'Confirmer')}
                    </button>
                  )}
                  {canCancel && (
                    <button
                      className="flex items-center gap-1.5 rounded-lg border border-[#bccac1] px-3 py-1.5 text-xs font-semibold text-[#3d4943] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-200"
                      disabled={isCancelling}
                      type="button"
                      onClick={() => doCancel(appointment.uid)}
                    >
                      <XCircle size={14} /> {t('appointments.actions.cancel', 'Annuler')}
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AppointmentsPage
