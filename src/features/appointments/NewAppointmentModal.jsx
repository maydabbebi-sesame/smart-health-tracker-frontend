import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, CalendarPlus, MapPin, Search, Stethoscope, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { useTranslation } from '../../i18n/useTranslation'
import { createAppointment } from '../../services/appointmentsService'
import { getExternalDoctors } from '../../services/doctorsService'

// Booking flow from the Appointments page: the picker searches the full
// doctor directory (platform-added, med.tn-scraped, and OSM-sourced alike,
// all stored in external_doctors — see GET /api/doctors/external) and books
// with doctor_uid (see backend/api/appointments.py's add_appointment).
export function NewAppointmentModal({ userUid, onClose, onCreated }) {
  const { t } = useTranslation()
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setSearchTerm(searchInput.trim()), 300)
    return () => clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const { data, isLoading } = useQuery({
    queryKey: ['external-doctors', searchTerm],
    queryFn: () => getExternalDoctors({ query: searchTerm }),
    enabled: !selectedDoctor,
  })

  const doctors = data?.success ? data.data : []
  const fetchError = data?.success === false ? data.error : null

  async function handleSubmit() {
    if (!date || !time) {
      toast.error(t('newAppointment.missingDateTimeError', 'Choisissez une date et une heure.'))
      return
    }
    setSubmitting(true)
    const result = await createAppointment({
      user_uid: userUid,
      doctor_uid: selectedDoctor.uid,
      appointment_date: date,
      appointment_time: time,
      reason,
    })
    setSubmitting(false)
    if (result.success) {
      toast.success(t('newAppointment.successMessage', 'RDV enregistré avec {{name}}.', { name: selectedDoctor.name }))
      onCreated?.()
      onClose()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative w-full max-w-md rounded-3xl border border-white/60 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95"
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            aria-label={t('newAppointment.closeButtonAriaLabel', 'Fermer')}
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-[#e4eae4] text-[#3d4943] transition hover:bg-[#dee4de] dark:bg-slate-800 dark:text-slate-200"
            type="button"
            onClick={onClose}
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#00694c] to-[#0060a8] text-white shadow">
              <CalendarPlus size={20} />
            </div>
            <h2 className="text-lg font-bold text-[#171d1a] dark:text-white">
              {t('newAppointment.title', 'Nouveau rendez-vous')}
            </h2>
          </div>

          {!selectedDoctor ? (
            <div className="mt-5">
              <label className="relative block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7a73]" size={16} />
                <input
                  autoFocus
                  className="w-full rounded-xl border border-[#bccac1] bg-white py-2.5 pl-9 pr-3 text-sm text-[#171d1a] outline-none focus:border-[#00694c] dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  placeholder={t('newAppointment.searchPlaceholder', 'Rechercher un médecin, une spécialité, une ville...')}
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </label>

              <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                {isLoading && (
                  <p className="py-6 text-center text-sm text-[#6d7a73]">{t('newAppointment.loading', 'Recherche en cours...')}</p>
                )}
                {fetchError && <p className="py-6 text-center text-sm text-[#ba1a1a]">{fetchError}</p>}
                {!isLoading && !fetchError && doctors.length === 0 && (
                  <p className="py-6 text-center text-sm text-[#6d7a73]">
                    {t('newAppointment.noResults', 'Aucun médecin trouvé.')}
                  </p>
                )}
                {doctors.map((doctor) => (
                  <button
                    className="flex w-full items-center gap-3 rounded-xl border border-[#dee4de] p-3 text-left transition hover:border-[#00694c] hover:bg-[#f5fbf5] dark:border-white/10 dark:hover:bg-slate-800"
                    key={doctor.uid}
                    type="button"
                    onClick={() => setSelectedDoctor(doctor)}
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#eff5ef] text-[#00694c] dark:bg-slate-800">
                      <Stethoscope size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#171d1a] dark:text-white">{doctor.name}</p>
                      <p className="truncate text-xs text-[#6d7a73]">{doctor.specialization}</p>
                      {doctor.location && (
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-[#6d7a73]">
                          <MapPin size={11} /> {doctor.location}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5">
              <button
                className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-[#00694c] dark:text-[#7cdcb4]"
                type="button"
                onClick={() => setSelectedDoctor(null)}
              >
                <ArrowLeft size={14} /> {t('newAppointment.changeDoctorButton', 'Changer de médecin')}
              </button>

              <div className="rounded-xl border border-[#dee4de] bg-[#f5fbf5]/80 p-3 dark:border-white/10 dark:bg-slate-800/60">
                <p className="font-semibold text-[#171d1a] dark:text-white">{selectedDoctor.name}</p>
                <p className="text-xs text-[#6d7a73]">{selectedDoctor.specialization}</p>
                {selectedDoctor.location && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-[#6d7a73]">
                    <MapPin size={11} /> {selectedDoctor.location}
                  </p>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="text-xs font-medium text-[#3d4943] dark:text-slate-300">
                  {t('newAppointment.dateLabel', 'Date')}
                  <input
                    className="mt-1 block w-full rounded-lg border border-[#bccac1] px-2 py-1.5 text-sm dark:border-white/10 dark:bg-slate-900"
                    min={new Date().toISOString().slice(0, 10)}
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
                <label className="text-xs font-medium text-[#3d4943] dark:text-slate-300">
                  {t('newAppointment.timeLabel', 'Heure')}
                  <input
                    className="mt-1 block w-full rounded-lg border border-[#bccac1] px-2 py-1.5 text-sm dark:border-white/10 dark:bg-slate-900"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </label>
              </div>

              <label className="mt-3 block text-xs font-medium text-[#3d4943] dark:text-slate-300">
                {t('newAppointment.reasonLabel', 'Motif (optionnel)')}
                <textarea
                  className="mt-1 block w-full resize-none rounded-lg border border-[#bccac1] px-2 py-1.5 text-sm dark:border-white/10 dark:bg-slate-900"
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="rounded-lg bg-[#e4eae4] px-3 py-1.5 text-xs font-medium text-[#3d4943] dark:bg-slate-700 dark:text-slate-200"
                  type="button"
                  onClick={onClose}
                >
                  {t('newAppointment.cancelButton', 'Annuler')}
                </button>
                <button
                  className="rounded-lg bg-gradient-to-r from-[#00694c] to-[#00b894] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  disabled={submitting}
                  type="button"
                  onClick={handleSubmit}
                >
                  {submitting ? t('newAppointment.sendingStatus', 'Enregistrement...') : t('newAppointment.confirmButton', 'Enregistrer le RDV')}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
