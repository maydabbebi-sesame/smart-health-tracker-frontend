import { motion } from 'framer-motion'

export function ProgressBar({ currentStep, steps }) {
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <nav className="mb-8 w-full">
      <div className="mb-4 flex items-center justify-between gap-4 px-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00694c]">
          Etape {currentStep + 1} sur {steps.length}
        </span>
        <span className="text-right text-xs font-medium text-[#6d7a73]">{steps[currentStep].title}</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[#dee4de]">
        <motion.div
          animate={{ width: `${progress}%` }}
          className="h-full rounded-full bg-[#008560]"
          initial={false}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <p className="mt-3 px-2 text-xs leading-5 text-[#6d7a73]">{steps[currentStep].description}</p>
    </nav>
  )
}
