'use client'

import i18next from '@/i18n/i18next'
import { useTranslation, UseTranslationOptions } from 'react-i18next'

export function useClientT(
  ns: string | string[] = 'common',
  options?: UseTranslationOptions<string>,
) {
  return useTranslation(ns, { i18n: i18next, ...options })
}
