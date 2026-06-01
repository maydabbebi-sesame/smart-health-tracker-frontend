import { motion } from 'framer-motion'

export function MotionCard({ children, className = '', delay = 0 }) {
  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className={className}
      initial={{ opacity: 0, y: 14 }}
      transition={{ delay, duration: 0.28, ease: 'easeOut' }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
    >
      {children}
    </motion.article>
  )
}
