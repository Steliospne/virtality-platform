'use server'

import i18next from '@/i18n/i18next'
import { settings } from '@/i18n/settings'
import { headers } from 'next/headers'
import { UseTranslationOptions } from 'react-i18next'

const { headerName } = settings

export async function getServerT(
  ns: string | string[],
  options?: UseTranslationOptions<string>,
) {
  const headerList = await headers()
  const lng = headerList.get(headerName)
  if (lng && i18next.resolvedLanguage !== lng) {
    await i18next.changeLanguage(lng)
  }
  if (ns && !i18next.hasLoadedNamespace(ns)) {
    await i18next.loadNamespaces(ns)
  }
  return {
    t: i18next.getFixedT(
      (lng ?? i18next.resolvedLanguage) || 'en',
      Array.isArray(ns) ? ns[0] : ns,
      options?.keyPrefix,
    ),
    i18n: i18next,
  }
}
