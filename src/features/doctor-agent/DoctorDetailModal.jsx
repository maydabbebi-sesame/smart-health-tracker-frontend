import { AnimatePresence, motion } from 'framer-motion'
import { Building2, Calendar, ExternalLink, Globe, Mail, MapPin, Navigation, Phone, Star, Stethoscope, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { useTranslation } from '../../i18n/useTranslation'
import { createAppointment } from '../../services/appointmentsService'
import { openDirections } from './geolocation'

const SOURCE_BADGE = {
  platform: { label: 'SmartHealth', className: 'bg-gradient-to-r from-[#00694c] to-[#00b894]' },
  'med.tn': { label: 'med.tn', className: 'bg-[#6d7a73]' },
  osm: { label: 'OpenStreetMap', className: 'bg-gradient-to-r from-[#0060a8] to-[#5b9cff]' },
}

// Fiche détail in-app — replaces what used to be a target="_blank" link to
// med.tn: shows whatever fields are actually available for this entry
// (platform/med.tn/OSM all have different completeness) plus the relevant
// actions (book, get directions from the user's real position).
export function DoctorDetailModal({ doctor, userUid, reason, onClose }) {
  const { t } = useTranslation()
  const [booking, setBooking] = useState(false)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const badge = SOURCE_BADGE[doctor?.source] || SOURCE_BADGE.osm
  const Icon = doctor?.kind === 'centre' ? Building2 : Stethoscope

  async function handleConfirmBooking() {
    if (!date || !time) {
      toast.error(t('doctorDetail.booking.missingDateTimeError', 'Choisissez une date et une heure.'))
      return
    }
    setSubmitting(true)
    const result = await createAppointment({
      user_uid: userUid,
      doctor_uid: doctor.id,
      appointment_date: date,
      appointment_time: time,
      reason: reason || '',
    })
    setSubmitting(false)
    if (result.success) {
      toast.success(t('doctorDetail.booking.successMessage', 'RDV enregistré avec Dr {{name}}.', { name: doctor.name }))
      onClose()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <AnimatePresence>
      {doctor && (
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
            key={doctor.id}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label={t('doctorDetail.closeButtonAriaLabel', 'Fermer')}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-[#e4eae4] text-[#3d4943] transition hover:bg-[#dee4de] dark:bg-slate-800 dark:text-slate-200"
              type="button"
              onClick={onClose}
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#00694c] to-[#0060a8] text-white shadow">
                <Icon size={22} />
              </div>
              <div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white ${badge.className}`}>
                  {doctor?.categoryLabel || badge.label}
                </span>
                <h2 className="mt-1.5 text-lg font-bold text-[#171d1a] dark:text-white">{doctor?.name}</h2>
                {doctor?.specialization && (
                  <p className="text-sm text-[#6d7a73] dark:text-slate-400">{doctor.specialization}</p>
                )}
              </div>
            </div>

            <div className="mt-5 space-y-2.5 text-sm">
              {doctor?.location && (
                <p className="flex items-start gap-2 text-[#3d4943] dark:text-slate-200">
                  <MapPin className="mt-0.5 shrink-0 text-[#6d7a73]" size={15} /> {doctor.location}
                </p>
              )}
              {doctor?.distanceKm != null && (
                <p className="flex items-center gap-2 font-semibold text-[#0060a8] dark:text-[#7cb8ff]">
                  <Navigation size={15} /> {doctor.distanceKm} km
                </p>
              )}
              {doctor?.rating ? (
                <p className="flex items-center gap-2 text-[#9a6700]">
                  <Star fill="currentColor" size={15} /> {Number(doctor.rating).toFixed(1)} / 5
                </p>
              ) : null}
              {doctor?.phone && (
                <a className="flex items-center gap-2 text-[#3d4943] underline-offset-2 hover:underline dark:text-slate-200" href={`tel:${doctor.phone.split(';')[0]}`}>
                  <Phone className="shrink-0 text-[#6d7a73]" size={15} /> {doctor.phone.split(';').join(' / ')}
                </a>
              )}
              {doctor?.email && (
                <a className="flex items-center gap-2 text-[#3d4943] underline-offset-2 hover:underline dark:text-slate-200" href={`mailto:${doctor.email}`}>
                  <Mail className="shrink-0 text-[#6d7a73]" size={15} /> {doctor.email}
                </a>
              )}
              {doctor?.website && (
                <a className="flex items-center gap-2 text-[#0060a8] underline-offset-2 hover:underline dark:text-[#7cb8ff]" href={doctor.website} rel="noreferrer" target="_blank">
                  <Globe className="shrink-0" size={15} /> {t('doctorDetail.websiteLink', 'Site web')} <ExternalLink size={12} />
                </a>
              )}
              {!doctor?.location && !doctor?.phone && !doctor?.email && !doctor?.website && (
                <p className="text-xs italic text-[#6d7a73] dark:text-slate-500">{t('doctorDetail.noContactInfo', 'Aucune information de contact disponible pour cette fiche.')}</p>
              )}
            </div>

            {booking ? (
              <div className="mt-5 flex flex-wrap items-end gap-2 rounded-xl border border-[#dee4de] bg-[#f5fbf5]/80 p-3 dark:border-white/10 dark:bg-slate-800/60">
                <label className="text-xs text-[#3d4943] dark:text-slate-300">
                  {t('doctorDetail.booking.dateLabel', 'Date')}
                  <input
                    className="mt-1 block rounded-lg border border-[#bccac1] px-2 py-1 text-xs dark:border-white/10 dark:bg-slate-900"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
                <label className="text-xs text-[#3d4943] dark:text-slate-300">
                  {t('doctorDetail.booking.timeLabel', 'Heure')}
                  <input
                    className="mt-1 block rounded-lg border border-[#bccac1] px-2 py-1 text-xs dark:border-white/10 dark:bg-slate-900"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </label>
                <button
                  className="rounded-lg bg-gradient-to-r from-[#00694c] to-[#00b894] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  disabled={submitting}
                  type="button"
                  onClick={handleConfirmBooking}
                >
                  {submitting ? t('doctorDetail.booking.sendingStatus', 'Envoi...') : t('doctorDetail.booking.confirmButton', 'Confirmer')}
                </button>
                <button className="rounded-lg bg-[#e4eae4] px-3 py-1.5 text-xs font-medium text-[#3d4943] dark:bg-slate-700 dark:text-slate-200" type="button" onClick={() => setBooking(false)}>
                  {t('doctorDetail.booking.cancelButton', 'Annuler')}
                </button>
              </div>
            ) : (
              <div className="mt-6 flex flex-wrap gap-2">
                {doctor?.bookable && (
                  <button
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00694c] to-[#00b894] px-4 py-2 text-sm font-semibold text-white shadow-md"
                    type="button"
                    onClick={() => setBooking(true)}
                  >
                    <Calendar size={15} /> {t('doctorDetail.requestAppointmentButton', 'Enregistrer un RDV')}
                  </button>
                )}
                {(doctor?.lat != null && doctor?.lng != null || doctor?.location) && (
                  <button
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0060a8] to-[#5b9cff] px-4 py-2 text-sm font-semibold text-white shadow-md"
                    type="button"
                    onClick={() => openDirections(doctor.lat, doctor.lng, doctor.location)}
                  >
                    <Navigation size={15} /> {t('doctorDetail.directionsButton', 'Itinéraire')}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
