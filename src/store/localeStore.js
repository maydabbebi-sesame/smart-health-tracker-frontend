import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useLocaleStore = create(
  persist(
    (set) => ({
      locale: 'fr',
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'smart-health-locale',
    },
  ),
)
