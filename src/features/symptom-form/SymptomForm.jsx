import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, BrainCircuit, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Send } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { analyzeSymptoms } from '../../services/symptomService'
import { ProgressBar } from './ProgressBar'
import { StepDeviceMeasures } from './StepDeviceMeasures'
import { StepLifestyleReview } from './StepLifestyleReview'
import { StepMedicalHistory } from './StepMedicalHistory'
import { StepPersonalInfo } from './StepPersonalInfo'
import { StepSymptoms } from './StepSymptoms'
import { StepTreatments } from './StepTreatments'

const steps = [
  { title: 'Donnees personnelles', description: 'Contexte permanent pour les modeles LLM.' },
  { title: 'Mesures appareils', description: 'Donnees optionnelles mesurees a domicile.' },
  { title: 'Antecedents medicaux', description: 'Historique patient et facteurs de risque.' },
  { title: 'Traitements', description: 'Medicaments, complements et observance.' },
  { title: 'Symptomes actuels', description: 'Point d entree principal de la consultation.' },
  { title: 'Mode de vie & submit', description: 'Habitudes quotidiennes et validation finale.' },
]

const stepFields = [
  ['age', 'biologicalSex', 'weight', 'height', 'pregnancyStatus'],
  ['bloodPressureSys', 'bloodPressureDia', 'heartRate', 'spo2', 'temperature', 'glycemia', 'weightVariation'],
  [
    'chronicDiseases',
    'hasDrugAllergies',
    'drugAllergies',
    'familyHistory',
    'tobacco',
    'tobaccoQuantity',
    'alcohol',
    'alcoholQuantity',
  ],
  ['hasCurrentMedications', 'currentMedications', 'hasSupplements', 'supplements', 'treatmentAdherence'],
  ['symptoms', 'otherSymptoms', 'painIntensity', 'symptomDuration', 'painLocation', 'triggers', 'generalState'],
  ['physicalActivity', 'diet', 'sleepQuality', 'stressLevel', 'description', 'consent'],
]

const optionalNumber = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined
  }

  return Number(value)
}, z.number().optional())

const schema = z.object({
  age: z.coerce.number({ error: 'Age requis.' }).int('Age entier requis.').min(1, 'Age invalide.').max(120, 'Age invalide.'),
  biologicalSex: z.string().min(1, 'Selectionnez le sexe biologique.'),
  weight: z.coerce.number({ error: 'Poids requis.' }).min(20, 'Poids invalide.').max(350, 'Poids invalide.'),
  height: z.coerce.number({ error: 'Taille requise.' }).int('Taille entiere requise.').min(80, 'Taille invalide.').max(240, 'Taille invalide.'),
  pregnancyStatus: z.string().optional(),
  bloodPressureSys: optionalNumber,
  bloodPressureDia: optionalNumber,
  heartRate: optionalNumber,
  spo2: optionalNumber,
  temperature: optionalNumber,
  glycemia: optionalNumber,
  weightVariation: z.string().optional(),
  chronicDiseases: z.array(z.string()).min(1, 'Selectionnez au moins une maladie chronique.'),
  hasDrugAllergies: z.string().min(1, 'Indiquez si le patient a des allergies.'),
  drugAllergies: z.string().trim().optional(),
  familyHistory: z.array(z.string()).optional(),
  tobacco: z.string().min(1, 'Indiquez la consommation de tabac.'),
  tobaccoQuantity: z.string().trim().optional(),
  alcohol: z.string().min(1, 'Indiquez la consommation d alcool.'),
  alcoholQuantity: z.string().trim().optional(),
  hasCurrentMedications: z.string().min(1, 'Indiquez si un traitement est en cours.'),
  currentMedications: z.array(z.object({ value: z.string().trim() })).optional(),
  hasSupplements: z.string().optional(),
  supplements: z.string().trim().optional(),
  treatmentAdherence: z.string().optional(),
  symptoms: z.array(z.string()).min(1, 'Selectionnez au moins un symptome.'),
  otherSymptoms: z.string().trim().optional(),
  painIntensity: z.coerce.number().min(0).max(10).optional(),
  symptomDuration: z.string().optional(),
  painLocation: z.array(z.string()).optional(),
  triggers: z.array(z.string()).optional(),
  generalState: z.string().optional(),
  physicalActivity: z.string().optional(),
  diet: z.array(z.string()).optional(),
  sleepQuality: z.string().optional(),
  stressLevel: z.coerce.number().min(1).max(5).optional(),
  description: z.string().trim().max(600, 'Limitez la description a 600 caracteres.').optional(),
  consent: z.boolean().refine(Boolean, 'Consentement requis avant l analyse.'),
}).superRefine((values, ctx) => {
  if (values.biologicalSex === 'F' && !values.pregnancyStatus) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Indiquez le statut de grossesse.',
      path: ['pregnancyStatus'],
    })
  }

  if (values.hasDrugAllergies === 'Oui' && !values.drugAllergies) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Precisez les allergies medicamenteuses.',
      path: ['drugAllergies'],
    })
  }

  if (values.hasCurrentMedications === 'Oui' && (!values.currentMedications || values.currentMedications.every((m) => !m.value?.trim()))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Precisez au moins un medicament.',
      path: ['currentMedications'],
    })
  }

  if (values.tobacco === 'Oui' && !values.tobaccoQuantity) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Precisez la quantite de tabac.',
      path: ['tobaccoQuantity'],
    })
  }

  if (values.alcohol === 'Oui' && !values.alcoholQuantity) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Precisez la frequence de consommation d alcool.',
      path: ['alcoholQuantity'],
    })
  }

  if (values.hasSupplements === 'Oui' && !values.supplements) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Precisez les complements ou plantes utilises.',
      path: ['supplements'],
    })
  }

  if (values.symptoms?.length && !values.symptomDuration) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Indiquez la duree des symptomes.',
      path: ['symptomDuration'],
    })
  }

  const hasPainSymptom = values.symptoms?.some((symptom) => symptom.toLowerCase().includes('douleur'))

  if (hasPainSymptom && (values.painIntensity === undefined || values.painIntensity === null)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Indiquez l intensite de la douleur.',
      path: ['painIntensity'],
    })
  }
})

const defaultValues = {
  age: 52,
  biologicalSex: 'F',
  weight: 72,
  height: 163,
  pregnancyStatus: 'Non',
  bloodPressureSys: 148,
  bloodPressureDia: 92,
  heartRate: 82,
  spo2: 97,
  temperature: 37.4,
  glycemia: '',
  weightVariation: 'Stable',
  chronicDiseases: ['HTA', 'Diabete T1/T2'],
  hasDrugAllergies: 'Oui',
  drugAllergies: 'Penicilline',
  familyHistory: ['Cardio', 'Diabete'],
  tobacco: 'Non',
  tobaccoQuantity: '',
  alcohol: 'Oui',
  alcoholQuantity: 'Occasionnel',
  hasCurrentMedications: 'Oui',
  currentMedications: [{ value: 'Metformine 1000mg 2x/j' }, { value: 'Amlodipine 5mg/j' }],
  hasSupplements: 'Non',
  supplements: '',
  treatmentAdherence: 'Toujours',
  symptoms: ['Fatigue', 'Cephalees'],
  otherSymptoms: '',
  painIntensity: 6,
  symptomDuration: 'Semaines',
  painLocation: ['Tete'],
  triggers: ['Stress'],
  generalState: 'Moyen',
  physicalActivity: 'Sedentaire',
  diet: ['Diabetique'],
  sleepQuality: 'Mauvais',
  stressLevel: 4,
  description: '',
  consent: false,
}

export function SymptomForm() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [savedData, setSavedData] = useState(null)
  const [submitError, setSubmitError] = useState('')

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
    trigger,
  } = useForm({
    defaultValues,
    mode: 'onTouched',
    resolver: zodResolver(schema),
  })

  const values = useWatch({ control })

  async function goNext() {
    const isValid = await trigger(stepFields[currentStep], { shouldFocus: true })

    if (isValid) {
      setSubmitError('')
      setCurrentStep((step) => Math.min(step + 1, steps.length - 1))
    }
  }

  function goPrevious() {
    setSubmitError('')
    setCurrentStep((step) => Math.max(step - 1, 0))
  }

  async function onSubmit(formValues) {
    setSubmitError('')

    try {
      const payload = {
        ...formValues,
        currentMedications: formValues.currentMedications?.map((m) => m.value).filter(Boolean).join(', ') || '',
      }
      await analyzeSymptoms(payload)
      setSavedData(payload)
      toast.success('Indicateurs sauvegardés avec succès')
    } catch (error) {
      setSubmitError(error.message || 'Une erreur est survenue.')
      toast.error('Une erreur est survenue.')
    }
  }

  function startOver() {
    reset(defaultValues)
    setCurrentStep(0)
    setSavedData(null)
    setSubmitError('')
  }

  if (savedData) {
    return (
      <motion.section animate={{ opacity: 1, y: 0 }} className="w-full sht-card p-8" initial={{ opacity: 0, y: 16 }}>
        <div className="grid h-14 w-14 place-items-center rounded-xl bg-[#86f8c9]/35 text-[#00694c]">
          <CheckCircle2 size={30} />
        </div>

        <h2 className="mt-5 text-2xl font-semibold text-[#171d1a] dark:text-white">
          Indicateurs sauvegardés
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#3d4943]">
          Vos données de santé ont bien été enregistrées. Souhaitez-vous obtenir des recommandations
          personnalisées et discuter avec notre médecin IA ?
        </p>

        <div className="mt-6 rounded-xl border border-[#dee4de] bg-[#f5fbf5] p-4 text-sm leading-6 text-[#3d4943]">
          <p className="font-semibold text-[#171d1a]">MediAssist va :</p>
          <ul className="mt-2 space-y-1">
            <li className="flex gap-2"><CheckCircle2 className="mt-0.5 shrink-0 text-[#00694c]" size={15} /> Analyser vos symptômes et indicateurs biologiques</li>
            <li className="flex gap-2"><CheckCircle2 className="mt-0.5 shrink-0 text-[#00694c]" size={15} /> Évaluer le niveau d'urgence de votre situation</li>
            <li className="flex gap-2"><CheckCircle2 className="mt-0.5 shrink-0 text-[#00694c]" size={15} /> Vous fournir des recommandations personnalisées</li>
            <li className="flex gap-2"><CheckCircle2 className="mt-0.5 shrink-0 text-[#00694c]" size={15} /> Répondre à vos questions de santé</li>
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-[#00694c] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#008560]"
            type="button"
            onClick={() => navigate('/ai-analysis', { state: { patientData: savedData } })}
          >
            <BrainCircuit size={18} />
            Parler à MediAssist
          </button>
          <button
            className="inline-flex h-12 items-center rounded-xl border-2 border-[#bccac1] px-5 text-sm font-semibold text-[#3d4943] transition hover:bg-[#eff5ef]"
            type="button"
            onClick={startOver}
          >
            Nouvelle analyse
          </button>
        </div>
      </motion.section>
    )
  }

  return (
    <section className="w-full">
      <ProgressBar currentStep={currentStep} steps={steps} />

      <form className="rounded-xl border border-[#bccac1]/30 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:p-8" onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            initial={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.22 }}
          >
            {currentStep === 0 && (
              <StepPersonalInfo
                errors={errors}
                register={register}
                values={values}
              />
            )}
            {currentStep === 1 && <StepDeviceMeasures errors={errors} register={register} values={values} />}
            {currentStep === 2 && (
              <StepMedicalHistory errors={errors} register={register} setValue={setValue} values={values} />
            )}
            {currentStep === 3 && <StepTreatments control={control} errors={errors} register={register} values={values} />}
            {currentStep === 4 && (
              <StepSymptoms
                errors={errors}
                register={register}
                selectedSymptoms={values.symptoms}
                setValue={setValue}
                values={values}
              />
            )}
            {currentStep === 5 && <StepLifestyleReview errors={errors} register={register} values={values} />}
          </motion.div>
        </AnimatePresence>

        {submitError && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-[#ffdad6] bg-[#ffdad6] p-4 text-sm font-medium text-[#93000a]">
            <AlertTriangle size={18} />
            {submitError || 'Something went wrong'}
          </div>
        )}

        {isSubmitting && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-[#d2e4ff] bg-[#d2e4ff] p-4 text-sm font-medium text-[#004880]">
            <Loader2 className="animate-spin" size={18} />
            Analyse des symptomes...
          </div>
        )}

        <div className="mt-8 flex flex-col gap-4 border-t border-slate-100 pt-8 md:flex-row">
          <button
            className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#bccac1] text-sm font-semibold text-[#3d4943] transition hover:bg-[#eff5ef] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={isSubmitting}
            type="button"
            onClick={goPrevious}
          >
            {currentStep > 0 && <ChevronLeft size={18} />}
            Retour
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              className="inline-flex h-14 flex-[2] items-center justify-center gap-2 rounded-xl bg-[#00694c] text-sm font-bold text-white shadow-lg transition hover:bg-[#008560]"
              type="button"
              onClick={goNext}
            >
              {currentStep === 0 ? 'Continuer' : 'Suivant'}
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              className="inline-flex h-14 flex-[2] items-center justify-center gap-2 rounded-xl bg-[#00694c] text-sm font-bold text-white shadow-lg transition hover:bg-[#008560] disabled:cursor-not-allowed disabled:bg-[#68dbae]"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Analyse
                </>
              ) : (
                <>
                  <Send size={18} />
                  Lancer l analyse
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
