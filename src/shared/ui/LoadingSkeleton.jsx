import { motion } from 'framer-motion'

const blocks = ['h-24', 'h-40', 'h-40']

export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-5 w-40 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-3 h-4 w-64 max-w-full animate-pulse rounded-full bg-slate-100" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {blocks.map((height, index) => (
          <motion.div
            animate={{ opacity: [0.45, 1, 0.45] }}
            className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${height}`}
            key={height}
            transition={{ delay: index * 0.12, duration: 1.2, repeat: Infinity }}
          >
            <div className="h-4 w-28 rounded-full bg-slate-100" />
            <div className="mt-4 h-8 w-20 rounded-full bg-slate-100" />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
