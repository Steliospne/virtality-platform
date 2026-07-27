import type { CredibilityLogoItem, PressLogoItem } from '../content'

export type PartnerRow = {
  kind: 'strategic' | 'clinical'
  logos: CredibilityLogoItem[]
}

export function isValidLogoItem(
  item: CredibilityLogoItem | PressLogoItem,
): boolean {
  return Boolean(item.src?.trim() && item.alt?.trim())
}

export function filterValidLogoItems<T extends CredibilityLogoItem>(
  items: readonly T[],
): T[] {
  return items.filter(isValidLogoItem)
}

export function getVisiblePartnerRows(
  strategicLogos: readonly CredibilityLogoItem[],
  clinicalLogos: readonly CredibilityLogoItem[],
): PartnerRow[] {
  const rows: PartnerRow[] = []
  const strategic = filterValidLogoItems(strategicLogos)
  const clinical = filterValidLogoItems(clinicalLogos)

  if (strategic.length > 0) {
    rows.push({ kind: 'strategic', logos: strategic })
  }

  if (clinical.length > 0) {
    rows.push({ kind: 'clinical', logos: clinical })
  }

  return rows
}

export function hasPartnerSection(
  strategicLogos: readonly CredibilityLogoItem[],
  clinicalLogos: readonly CredibilityLogoItem[],
): boolean {
  return getVisiblePartnerRows(strategicLogos, clinicalLogos).length > 0
}

export function hasPressSection(pressItems: readonly PressLogoItem[]): boolean {
  return filterValidLogoItems(pressItems).length > 0
}

export function getPressLinkProps(href?: string) {
  if (!href?.trim()) {
    return {}
  }

  return {
    target: '_blank' as const,
    rel: 'noopener noreferrer',
  }
}
