const fallbackLng = 'en'

import * as Flags from 'country-flag-icons/react/3x2'

export const flagMap = {
  en: Flags.US,
  el: Flags.GR,
} as const

export type FlagKeys = keyof typeof flagMap

export const settings = {
  fallbackLng,
  languages: [fallbackLng, 'el'],
  defaultNS: 'patient-dashboard',
  cookieName: 'i18next',
  headerName: 'x-i18next-current-language',
}
