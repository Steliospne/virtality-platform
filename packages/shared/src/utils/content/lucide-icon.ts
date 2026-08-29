const NON_ICON_EXPORTS = new Set(['Icon', 'createLucideIcon', 'icons'])

const REACT_FORWARD_REF = Symbol.for('react.forward_ref')

export type LucideModule = Record<string, unknown>

type LucideForwardRefComponent = {
  render: (...args: unknown[]) => unknown
  $$typeof: symbol
}

function isLucideForwardRefComponent(
  value: unknown,
): value is LucideForwardRefComponent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'render' in value &&
    typeof value.render === 'function' &&
    '$$typeof' in value &&
    value.$$typeof === REACT_FORWARD_REF
  )
}

export function isRenderableLucideIcon(
  iconName: string,
  lucideModule: LucideModule,
): boolean {
  if (!iconName || NON_ICON_EXPORTS.has(iconName)) {
    return false
  }

  return isLucideForwardRefComponent(lucideModule[iconName])
}

export function resolveLucideIconFromModule(
  iconName: string | undefined,
  lucideModule: LucideModule,
): LucideModule[string] | null {
  if (!iconName || !isRenderableLucideIcon(iconName, lucideModule)) {
    return null
  }

  return lucideModule[iconName]
}
