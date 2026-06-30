import { Outlet } from 'react-router-dom'
import { Bell, BrainCircuit, ChartNoAxesColumnIncreasing, ShieldPlus } from 'lucide-react'

import { useTranslation } from '../i18n/useTranslation'
import { LanguageSwitcher } from '../shared/ui/LanguageSwitcher'

const valueProps = [
  {
    titleKey: 'authLayout.valueProps.ai.title',
    title: 'IA personnalisée',
    textKey: 'authLayout.valueProps.ai.text',
    text: 'Des analyses prédictives basées sur votre profil unique.',
    icon: BrainCircuit,
    className: 'bg-[#86f8c9] text-[#002115]',
  },
  {
    titleKey: 'authLayout.valueProps.alerts.title',
    title: 'Alertes temps réel',
    textKey: 'authLayout.valueProps.alerts.text',
    text: 'Soyez informé instantanément des changements importants.',
    icon: Bell,
    className: 'bg-[#d2e4ff] text-[#001c38]',
  },
  {
    titleKey: 'authLayout.valueProps.recommendations.title',
    title: 'Recommandations',
    textKey: 'authLayout.valueProps.recommendations.text',
    text: 'Des conseils actionnables pour optimiser votre vitalité.',
    icon: ChartNoAxesColumnIncreasing,
    className: 'bg-[#ffdad6] text-[#7e2a27]',
  },
]

export function AuthLayout() {
  const { t } = useTranslation()

  return (
    <main className="min-h-screen bg-[#f5fbf5]">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="sht-primary-gradient relative hidden overflow-hidden p-8 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute right-[-12%] top-[-12%] h-96 w-96 rounded-full bg-[#00694c]/5 blur-3xl" />
          <div className="relative z-10">
            <div className="mb-8 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#00694c] text-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                  <ShieldPlus size={22} />
                </div>
                <span className="text-2xl font-bold text-[#00694c]">SmartHealth</span>
              </div>
              <LanguageSwitcher />
            </div>

            <div className="max-w-md">
              <h1 className="text-[32px] font-semibold leading-tight text-[#171d1a]">
                {t('authLayout.heroTitle', 'Votre santé, suivie intelligemment.')}
              </h1>
              <p className="mt-4 text-base leading-7 text-[#3d4943]">
                {t(
                  'authLayout.heroText',
                  "Prenez le contrôle de votre bien-être avec une précision médicale et une interface intuitive conçue pour votre quotidien.",
                )}
              </p>
            </div>

            <div className="mt-8 overflow-hidden rounded-xl border border-[#bccac1]/30 bg-white/70 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              <img
                alt={t('authLayout.heroImageAlt', 'Patient utilisant une application de suivi santé')}
                className="h-56 w-full object-cover"
                src="/login-ai-healthcare.png"
              />
            </div>

            <div className="mt-8 space-y-4">
              {valueProps.map((item) => (
                <div
                  className="sht-soft-card flex items-start gap-4 p-4 backdrop-blur-sm"
                  key={item.title}
                >
                  <div className={`grid h-11 w-11 place-items-center rounded-lg ${item.className}`}>
                    <item.icon size={21} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-[#171d1a]">{t(item.titleKey, item.title)}</h2>
                    <p className="mt-1 text-sm leading-6 text-[#3d4943]">{t(item.textKey, item.text)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 rounded-xl border border-[#bccac1]/30 bg-white/70 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] backdrop-blur">
            <p className="sht-kicker">{t('authLayout.demoKicker', 'Démo Frontend')}</p>
            <p className="mt-2 text-sm leading-6 text-[#3d4943]">
              {t(
                'authLayout.demoText',
                'Tableau de bord patient, analyse IA simulée, suivi santé et architecture prête pour backend.',
              )}
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center bg-white p-6">
          <Outlet />
        </section>
      </div>
    </main>
  )
}
