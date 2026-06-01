import { Bell, LockKeyhole, Palette } from 'lucide-react'

function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">Manage dashboard preferences and account defaults.</p>
      </div>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
              <Bell size={20} />
            </div>
            <h2 className="font-semibold text-slate-950">Notifications</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
              <span>
                <span className="block font-medium text-slate-950">Critical alert emails</span>
                <span className="text-sm text-slate-500">Receive email when a report needs urgent review.</span>
              </span>
              <input className="h-5 w-5 accent-teal-600" defaultChecked type="checkbox" />
            </label>
            <label className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
              <span>
                <span className="block font-medium text-slate-950">Daily summary</span>
                <span className="text-sm text-slate-500">Send a daily health digest every morning.</span>
              </span>
              <input className="h-5 w-5 accent-teal-600" defaultChecked type="checkbox" />
            </label>
          </div>
        </article>

        <aside className="space-y-4">
          {[
            { label: 'Privacy mode', text: 'Hide sensitive content in shared spaces.', icon: LockKeyhole },
            { label: 'Theme', text: 'Healthcare blue and green palette.', icon: Palette },
          ].map((item) => (
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={item.label}>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-50 text-cyan-700">
                <item.icon size={20} />
              </div>
              <h2 className="mt-4 font-semibold text-slate-950">{item.label}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </article>
          ))}
        </aside>
      </section>
    </div>
  )
}

export default SettingsPage
