import { useTranslation } from '../../i18n/useTranslation'

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation()

  return (
    <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 text-xs font-semibold shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <button
        aria-pressed={locale === 'fr'}
        className={`rounded-lg px-2 py-1 transition ${
          locale === 'fr'
            ? 'bg-[#00694c] text-white'
            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
        type="button"
        onClick={() => setLocale('fr')}
      >
        FR
      </button>
      <button
        aria-pressed={locale === 'en'}
        className={`rounded-lg px-2 py-1 transition ${
          locale === 'en'
            ? 'bg-[#00694c] text-white'
            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
        type="button"
        onClick={() => setLocale('en')}
      >
        EN
      </button>
    </div>
  )
}
