import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2, Send } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { analyzeSymptoms } from '../../services/symptomService'
import { useMedAssistStore } from '../../store/medAssistStore'
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
  weightVariationKg: optionalNumber,
  chronicDiseases: z.array(z.string()).min(1, 'Selectionnez au moins une maladie chronique.'),
  hasDrugAllergies: z.string().min(1, 'Indiquez si le patient a des allergies.'),
  drugAllergies: z.array(z.object({ value: z.string().trim() })).optional(),
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

  if (values.hasDrugAllergies === 'Oui' && (!values.drugAllergies || values.drugAllergies.every((allergy) => !allergy.value?.trim()))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Precisez au moins une allergie medicamenteuse.',
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

  if ((values.weightVariation === 'Prise' || values.weightVariation === 'Perte') && values.weightVariationKg === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Indiquez le nombre de kilos pris ou perdus.',
      path: ['weightVariationKg'],
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
  age: '',
  biologicalSex: '',
  weight: '',
  height: '',
  pregnancyStatus: '',
  bloodPressureSys: '',
  bloodPressureDia: '',
  heartRate: '',
  spo2: '',
  temperature: '',
  glycemia: '',
  weightVariation: '',
  weightVariationKg: '',
  chronicDiseases: [],
  hasDrugAllergies: '',
  drugAllergies: [],
  familyHistory: [],
  tobacco: '',
  tobaccoQuantity: '',
  alcohol: '',
  alcoholQuantity: '',
  hasCurrentMedications: '',
  currentMedications: [],
  hasSupplements: '',
  supplements: '',
  treatmentAdherence: '',
  symptoms: [],
  otherSymptoms: '',
  painIntensity: 0,
  symptomDuration: '',
  painLocation: [],
  triggers: [],
  generalState: '',
  physicalActivity: '',
  diet: [],
  sleepQuality: '',
  stressLevel: 1,
  description: '',
  consent: false,
}

export function SymptomForm() {
  const navigate = useNavigate()
  const setPatientData = useMedAssistStore((s) => s.setPatientData)
  const [currentStep, setCurrentStep] = useState(0)
  const [submitError, setSubmitError] = useState('')

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
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
        drugAllergies: formValues.drugAllergies?.map((allergy) => allergy.value).filter(Boolean).join(', ') || '',
      }
      await analyzeSymptoms(payload)
      toast.success('Indicateurs sauvegardés — MediAssist analyse vos données...')
      // Persist alongside the navigation state: the sidebar link to "AI
      // Recommendations" doesn't carry location.state, so without this the
      // page (and its chat) would look empty when revisited that way.
      setPatientData(payload)
      navigate('/ai-analysis', { state: { patientData: payload } })
    } catch (error) {
      setSubmitError(error.message || 'Une erreur est survenue.')
      toast.error('Une erreur est survenue.')
    }
  }

  return (
    <section className="w-full">
      <div className="mb-5 rounded-xl border border-[#d2e4ff] bg-[#eff5ef] p-4">
        <p className="text-sm font-semibold text-[#00694c]">Information importante</p>
        <p className="mt-2 text-sm leading-6 text-[#3d4943]">
          Les donnees saisies dans ce formulaire seront stockees dans notre base de donnees et fournies a un modele IA
          prive pour generer une analyse personnalisee. Cette demo reste frontend-only, mais le flux prepare le futur
          contrat backend.
        </p>
      </div>

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
              <StepMedicalHistory control={control} errors={errors} register={register} setValue={setValue} values={values} />
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
