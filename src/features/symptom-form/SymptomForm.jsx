import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Send } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'

import { analyzeSymptoms } from '../../services/symptomService'
import { ProgressBar } from './ProgressBar'
import { StepDescription } from './StepDescription'
import { StepPersonalInfo } from './StepPersonalInfo'
import { StepReview } from './StepReview'
import { StepSymptoms } from './StepSymptoms'

const steps = [
  { title: 'Personal Information', description: 'Basic details for context.' },
  { title: 'Symptoms Selection', description: 'Choose your current symptoms.' },
  { title: 'Additional Description', description: 'Tell us more in your words.' },
  { title: 'Review & Submit', description: 'Confirm and run fake analysis.' },
]

const stepFields = [['age', 'gender', 'weight'], ['symptoms'], ['description'], ['consent']]

const schema = z.object({
  age: z.coerce
    .number({ error: 'Age is required.' })
    .int('Age must be a whole number.')
    .min(1, 'Enter a valid age.')
    .max(120, 'Enter a valid age.'),
  gender: z.string().min(1, 'Select a gender option.'),
  weight: z.coerce
    .number({ error: 'Weight is required.' })
    .min(20, 'Enter a valid weight.')
    .max(350, 'Enter a valid weight.'),
  symptoms: z.array(z.string()).min(1, 'Select at least one symptom.'),
  description: z
    .string()
    .trim()
    .min(12, 'Describe your symptoms in at least 12 characters.')
    .max(600, 'Keep the description under 600 characters.'),
  consent: z.boolean().refine(Boolean, 'Consent is required before analysis.'),
})

const defaultValues = {
  age: '',
  gender: '',
  weight: '',
  symptoms: [],
  description: '',
  consent: false,
}

export function SymptomForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [result, setResult] = useState(null)
  const [submitError, setSubmitError] = useState('')

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
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
      const response = await analyzeSymptoms(formValues)
      setResult(response)
      toast.success('Analysis completed successfully')

      if (formValues.symptoms.includes('Chest Pain') || formValues.symptoms.includes('Shortness of Breath')) {
        toast('AI detected unusual symptoms', {
          icon: '!',
          style: {
            borderColor: '#fde68a',
          },
        })
      }
    } catch (error) {
      setSubmitError(error.message || 'Something went wrong')
      toast.error('Something went wrong')
    }
  }

  function startOver() {
    reset(defaultValues)
    setCurrentStep(0)
    setResult(null)
    setSubmitError('')
  }

  if (result) {
    return (
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-teal-200 bg-white p-6 shadow-sm sm:p-8"
        initial={{ opacity: 0, y: 16 }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-700">
              <CheckCircle2 size={30} />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-slate-950">Analysis completed successfully</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Your report was analyzed with a fake frontend-only AI response. Reference:
              <span className="ml-1 font-semibold text-slate-900">{result.id.slice(0, 8)}</span>
            </p>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
            {result.analysis.riskLevel} risk
          </span>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_280px]">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="font-semibold text-slate-950">AI summary</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">{result.analysis.summary}</p>
          </article>
          <article className="rounded-xl border border-cyan-200 bg-cyan-50 p-5">
            <p className="text-sm font-medium text-cyan-700">Confidence</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{result.analysis.confidence}%</p>
          </article>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-950">Recommendations</h3>
          <ul className="mt-3 space-y-2">
            {result.analysis.recommendations.map((item) => (
              <li className="flex gap-2 text-sm leading-6 text-slate-700" key={item}>
                <CheckCircle2 className="mt-0.5 text-teal-600" size={17} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <button
          className="mt-6 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
          type="button"
          onClick={startOver}
        >
          Start a new report
        </button>
      </motion.section>
    )
  }

  return (
    <section className="space-y-5">
      <ProgressBar currentStep={currentStep} steps={steps} />

      <form className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            initial={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.22 }}
          >
            {currentStep === 0 && <StepPersonalInfo errors={errors} register={register} />}
            {currentStep === 1 && (
              <StepSymptoms errors={errors} register={register} selectedSymptoms={values.symptoms} />
            )}
            {currentStep === 2 && (
              <StepDescription description={values.description} errors={errors} register={register} />
            )}
            {currentStep === 3 && <StepReview errors={errors} register={register} values={values} />}
          </motion.div>
        </AnimatePresence>

        {submitError && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
            <AlertTriangle size={18} />
            {submitError || 'Something went wrong'}
          </div>
        )}

        {isSubmitting && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-medium text-cyan-800">
            <Loader2 className="animate-spin" size={18} />
            Analyzing symptoms...
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={currentStep === 0 || isSubmitting}
            type="button"
            onClick={goPrevious}
          >
            <ChevronLeft size={18} />
            Previous
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
              type="button"
              onClick={goNext}
            >
              Next
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-400"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Analyzing
                </>
              ) : (
                <>
                  <Send size={18} />
                  Submit for analysis
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
