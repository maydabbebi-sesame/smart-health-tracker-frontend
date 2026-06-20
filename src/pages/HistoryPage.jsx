import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  AlertCircle,
  CalendarDays,
  Droplet,
  Droplets,
  FileText,
  Gauge,
  HeartPulse,
  Inbox,
  Loader2,
  Scale,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Thermometer,
  Users,
  Wind,
} from 'lucide-react'

import { getHealthHistory, groupRecordsByDate } from '../services/healthHistoryService'
import { exportTrendAnalysisPdf } from '../services/vitalsService'
import { getTrendsAnalysis } from '../services/mediAssistService'
import { LoadingSkeleton } from '../shared/ui/LoadingSkeleton'

const PERIOD_OPTIONS = [
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
  { value: '3months', label: '3 mois' },
]

// Fully static Tailwind class strings (no template-literal colors) so the
// JIT scanner picks every one of them up.
const CHIP_STYLES = {
  heart_rate: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  bp: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  temperature: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  oxygen_saturation: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  respiratory_rate: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
  glycemia: 'bg-pink-50 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300',
  weight: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  pain_intensity: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
}

function buildVitalChips(vital) {
  const chips = []
  if (vital.heart_rate != null) {
    chips.push({ key: 'heart_rate', icon: HeartPulse, label: 'Fréquence cardiaque', value: vital.heart_rate, unit: 'bpm', style: CHIP_STYLES.heart_rate })
  }
  if (vital.systolic_bp != null && vital.diastolic_bp != null) {
    chips.push({ key: 'bp', icon: Gauge, label: 'Tension artérielle', value: `${vital.systolic_bp}/${vital.diastolic_bp}`, unit: 'mmHg', style: CHIP_STYLES.bp })
  }
  if (vital.temperature != null) {
    chips.push({ key: 'temperature', icon: Thermometer, label: 'Température', value: vital.temperature, unit: '°C', style: CHIP_STYLES.temperature })
  }
  if (vital.oxygen_saturation != null) {
    chips.push({ key: 'oxygen_saturation', icon: Droplet, label: 'Saturation O2', value: vital.oxygen_saturation, unit: '%', style: CHIP_STYLES.oxygen_saturation })
  }
  if (vital.respiratory_rate != null) {
    chips.push({ key: 'respiratory_rate', icon: Wind, label: 'Fréquence respiratoire', value: vital.respiratory_rate, unit: '/min', style: CHIP_STYLES.respiratory_rate })
  }
  if (vital.glycemia != null) {
    chips.push({ key: 'glycemia', icon: Droplets, label: 'Glycémie', value: vital.glycemia, unit: 'g/L', style: CHIP_STYLES.glycemia })
  }
  if (vital.weight != null) {
    chips.push({ key: 'weight', icon: Scale, label: 'Poids', value: vital.weight, unit: 'kg', style: CHIP_STYLES.weight })
  }
  if (vital.pain_intensity != null) {
    chips.push({ key: 'pain_intensity', icon: AlertCircle, label: 'Intensité douleur', value: vital.pain_intensity, unit: '/10', style: CHIP_STYLES.pain_intensity })
  }
  return chips
}

const NARRATIVE_FIELDS = [
  { key: 'symptoms', label: 'Symptômes', icon: Stethoscope, style: 'bg-teal-50 text-teal-800 dark:bg-teal-500/10 dark:text-teal-200' },
  { key: 'pain_location', label: 'Localisation de la douleur', icon: AlertCircle, style: 'bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-200' },
  { key: 'health_issues_history', label: 'Antécédents médicaux', icon: FileText, style: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-200' },
  { key: 'drug_allergies', label: 'Allergies', icon: ShieldAlert, style: 'bg-[#ffdad6] text-[#93000a] dark:bg-red-500/15 dark:text-red-200' },
  { key: 'family_health_issues', label: 'Antécédents familiaux', icon: Users, style: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-200' },
  { key: 'notes', label: 'Notes', icon: FileText, style: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-200' },
]

function formatDateHeading(dateKey) {
  if (!dateKey || dateKey === 'Date inconnue') return 'Date inconnue'
  const date = new Date(`${dateKey}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dateKey
  const label = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function buildAnalysisFilename(period) {
  const label = PERIOD_OPTIONS.find((option) => option.value === period)?.label || period
  const slug = label.trim().replace(/\s+/g, '-')
  const today = new Date()
  const day = String(today.getDate()).padStart(2, '0')
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const year = today.getFullYear()
  return `Analyse_tendances_${slug}_${day}-${month}-${year}.pdf`
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function HistoryPage() {
  const [period, setPeriod] = useState('week')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState(null)

  const { data: records, isLoading } = useQuery({
    queryKey: ['health-history', period],
    queryFn: () => getHealthHistory(1, 50, period),
  })

  const historyError = records && records.success === false ? records.error : null
  const recordList = records?.data || []
  const dateGroups = groupRecordsByDate(recordList)

  async function handleAnalyzeTrends() {
    setAnalysisError(null)
    setIsAnalyzing(true)
    try {
      const rawVitals = recordList.map((record) => record.originalVital)
      const { success, analysis, error } = await getTrendsAnalysis({ vitals: rawVitals, period })
      if (!success) {
        setAnalysisError(error)
        return
      }

      const pdfResult = await exportTrendAnalysisPdf(period, analysis)
      if (!pdfResult.success) {
        setAnalysisError(pdfResult.error)
        return
      }

      downloadBlob(pdfResult.data, buildAnalysisFilename(period))
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#00694c] via-[#00875f] to-[#0077b6] p-7 text-white shadow-lg shadow-[#00694c]/20">
        <HeartPulse className="absolute -right-4 -top-4 h-40 w-40 text-white/10" strokeWidth={1.5} />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Suivi sante</p>
        <h1 className="mt-2 text-[32px] font-bold leading-tight">Historique médical</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/85">
          Retrouvez ici toutes les données que vous avez transmises via vos formulaires de suivi, organisées jour par jour.
        </p>
      </div>

      <section className="sht-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map((option) => (
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                period === option.value
                  ? 'bg-gradient-to-r from-[#00694c] to-[#0077b6] text-white shadow-md shadow-[#00694c]/30'
                  : 'border border-[#bccac1] bg-[#f5fbf5] text-[#3d4943] hover:border-[#008560] hover:text-[#00694c]'
              }`}
              key={option.value}
              onClick={() => setPeriod(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <button
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f59e0b] via-[#fb7185] to-[#ec4899] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-500/30 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            disabled={isAnalyzing || recordList.length === 0}
            onClick={handleAnalyzeTrends}
            type="button"
          >
            {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            {isAnalyzing ? 'Analyse en cours...' : 'Analyser mes tendances'}
          </button>
          {analysisError && <p className="text-sm text-[#ba1a1a]">{analysisError}</p>}
        </div>
      </section>

      {historyError ? (
        <section className="sht-card flex flex-col items-center gap-3 p-12 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-red-50 text-[#ba1a1a]">
            <AlertCircle size={28} />
          </div>
          <p className="font-semibold text-[#171d1a] dark:text-white">Impossible de charger l'historique</p>
          <p className="max-w-md text-sm text-[#ba1a1a]">{historyError}</p>
        </section>
      ) : dateGroups.length === 0 ? (
        <section className="sht-card flex flex-col items-center gap-3 p-12 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-[#eff5ef] text-[#00694c]">
            <Inbox size={28} />
          </div>
          <p className="font-semibold text-[#171d1a] dark:text-white">Aucune donnée enregistrée pour cette période</p>
          <p className="max-w-md text-sm text-[#6d7a73]">
            Soumettez un formulaire de suivi ou changez de période pour voir apparaître votre historique ici.
          </p>
        </section>
      ) : (
        <div className="grid gap-5">
          {dateGroups.map((group) => (
            <article
              className="sht-card overflow-hidden border-l-4 border-l-[#00875f] p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
              key={group.date}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-base font-bold text-[#171d1a] dark:text-white">
                  <CalendarDays className="text-[#00694c]" size={19} />
                  {formatDateHeading(group.date)}
                </p>
                <span className="rounded-full bg-[#86f8c9]/35 px-3 py-1 text-xs font-semibold text-[#00513a]">
                  {group.records.length} relevé{group.records.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid gap-4">
                {group.records.map((record) => {
                  const vital = record.originalVital || {}
                  const chips = buildVitalChips(vital)
                  const narratives = NARRATIVE_FIELDS.filter((field) => vital[field.key])

                  return (
                    <div className="rounded-xl bg-[#f8fbf8] p-4 dark:bg-white/5" key={record.id}>
                      {chips.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {chips.map((chip) => {
                            const ChipIcon = chip.icon
                            return (
                              <div
                                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${chip.style}`}
                                key={chip.key}
                              >
                                <ChipIcon size={16} />
                                <span>
                                  {chip.label} : {chip.value}{chip.unit}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {narratives.length > 0 && (
                        <div className="mt-3 grid gap-2">
                          {narratives.map((field) => {
                            const FieldIcon = field.icon
                            return (
                              <div className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${field.style}`} key={field.key}>
                                <FieldIcon className="mt-0.5 shrink-0" size={16} />
                                <p>
                                  <span className="font-semibold">{field.label} : </span>
                                  {vital[field.key]}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {chips.length === 0 && narratives.length === 0 && (
                        <p className="text-sm text-[#6d7a73]">Aucune mesure renseignée pour ce relevé.</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default HistoryPage
