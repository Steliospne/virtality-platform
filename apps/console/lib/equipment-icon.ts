/**
 * Maps exercise items strings to public equipment assets.
 * Unknown items return null (caller shows text-only chip).
 */
export function equipmentIconSrcForItem(item: string): string | null {
  const k = item.toLowerCase()
  if (k.includes('dumbbells')) return '/assets/equipment/DUMBELL_ICON.png'
  if (k.includes('bar')) return '/assets/equipment/BAR_ICON.png'
  if (k.includes('thera-band')) return '/assets/equipment/THERA_BAND_ICON.png'
  if (k.includes('bodyweight')) return '/assets/equipment/BODYWEIGHT_ICON.png'
  return '/assets/equipment/BODYWEIGHT_ICON.png'
}
