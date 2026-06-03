import { Bell, LockKeyhole, Palette, ShieldCheck } from 'lucide-react'

function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[32px] font-semibold leading-tight text-[#171d1a] dark:text-white">Parametres</h1>
        <p className="mt-2 text-base leading-7 text-[#3d4943]">
          Configurez vos preferences de suivi, confidentialite et notifications.
        </p>
      </div>

      <section className="grid gap-6 xl:grid-cols-3">
        <article className="sht-card p-6 xl:col-span-2">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#86f8c9]/35 text-[#00694c]">
              <Bell size={21} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#171d1a] dark:text-white">Notifications</h2>
              <p className="text-sm text-[#6d7a73]">Alertes et resumes de votre activite sante.</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                title: 'Alertes critiques',
                text: 'Recevoir une notification quand un rapport necessite une attention urgente.',
              },
              {
                title: 'Resume quotidien',
                text: 'Recevoir un digest de sante chaque matin.',
              },
              {
                title: 'Insights IA',
                text: 'Afficher les notifications quand une tendance inhabituelle est detectee.',
              },
            ].map((item, index) => (
              <label
                className="flex items-center justify-between gap-4 rounded-lg bg-[#eff5ef] p-4"
                key={item.title}
              >
                <span>
                  <span className="block font-semibold text-[#171d1a] dark:text-white">{item.title}</span>
                  <span className="text-sm leading-6 text-[#6d7a73]">{item.text}</span>
                </span>
                <input className="h-5 w-5 accent-[#00694c]" defaultChecked={index < 2} type="checkbox" />
              </label>
            ))}
          </div>
        </article>

        <aside className="space-y-4">
          {[
            { label: 'Mode confidentialite', text: 'Masquer les donnees sensibles dans les espaces partages.', icon: LockKeyhole },
            { label: 'Theme', text: 'Palette healthcare vert, bleu et surfaces douces.', icon: Palette },
            { label: 'Securite', text: 'Token JWT mocke aujourd hui, pret pour backend.', icon: ShieldCheck },
          ].map((item) => (
            <article className="sht-card p-5" key={item.label}>
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#d2e4ff] text-[#0060a8]">
                <item.icon size={20} />
              </div>
              <h2 className="mt-4 font-semibold text-[#171d1a] dark:text-white">{item.label}</h2>
              <p className="mt-2 text-sm leading-6 text-[#3d4943]">{item.text}</p>
            </article>
          ))}
        </aside>
      </section>
    </div>
  )
}

export default SettingsPage
