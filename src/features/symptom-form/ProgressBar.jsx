import { motion } from 'framer-motion'

export function ProgressBar({ currentStep, steps }) {
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-950">{steps[currentStep].title}</p>
          <p className="mt-1 text-xs text-slate-500">{steps[currentStep].description}</p>
        </div>
        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
          {currentStep + 1}/{steps.length}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          animate={{ width: `${progress}%` }}
          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"
          initial={false}
          transition={{ duration: 0.25 }}
        />
      </div>
    </div>
  )
}
