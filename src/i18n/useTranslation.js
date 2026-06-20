import { useQuery } from '@tanstack/react-query'

import { useLocaleStore } from '../store/localeStore'
import { getTranslations } from '../services/translationService'

const LOCALE_TAGS = {
  fr: 'fr-FR',
  en: 'en-US',
}

function interpolate(template, vars) {
  if (!vars) {
    return template
  }
  return Object.entries(vars).reduce(
    (acc, [name, value]) => acc.split(`{{${name}}}`).join(String(value)),
    template,
  )
}

/**
 * Translation hook backed by the `translations` DB table.
 * Usage: const { t, locale, setLocale, localeTag } = useTranslation()
 *   t('page.key', 'Texte par defaut', { name: 'Jane' })
 *
 * The second argument is the current (French) text used as a fallback
 * while the dictionary loads or if a key is missing, so the UI never
 * shows raw keys. Translation rows are fetched once per locale and
 * cached by react-query.
 */
export function useTranslation() {
  const locale = useLocaleStore((state) => state.locale)
  const setLocale = useLocaleStore((state) => state.setLocale)

  const { data } = useQuery({
    queryKey: ['translations', locale],
    queryFn: () => getTranslations(locale),
    staleTime: Infinity,
  })

  const dictionary = data?.success ? data.data : null

  function t(key, fallback, vars) {
    const template = dictionary?.[key] ?? fallback ?? key
    return interpolate(template, vars)
  }

  return { t, locale, setLocale, localeTag: LOCALE_TAGS[locale] || LOCALE_TAGS.fr }
}
