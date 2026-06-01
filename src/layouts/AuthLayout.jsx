import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto grid min-h-screen max-w-6xl px-4 py-8 lg:grid-cols-[1fr_440px] lg:items-center lg:gap-12">
        <section className="hidden lg:block">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
            Smart Health Tracker
          </p>
          <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-tight text-slate-950">
            Your health dashboard, calm and clear.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
            Track symptoms, review health history, and use AI-assisted analysis in one protected workspace.
          </p>
        </section>

        <section className="flex items-center justify-center">
          <Outlet />
        </section>
      </div>
    </main>
  )
}
