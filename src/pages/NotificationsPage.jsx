import { Stethoscope } from 'lucide-react'

function NotificationsPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-2xl bg-[#e4eae4] text-[#3d4943]">
        <Stethoscope size={38} />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-[#171d1a] dark:text-white">Doctor Agent</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-[#6d7a73]">
          Cette fonctionnalité est en cours de développement. Un agent médical IA
          sera bientôt disponible pour vous connecter avec des professionnels de santé.
        </p>
      </div>
      <span className="rounded-full border border-[#bccac1] bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#6d7a73] dark:bg-slate-900">
        Prochainement
      </span>
    </div>
  )
}

export default NotificationsPage
