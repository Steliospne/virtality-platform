const REACT_FORWARD_REF = Symbol.for('react.forward_ref')

export function mockLucideIcon() {
  return {
    $$typeof: REACT_FORWARD_REF,
    render: () => null,
  }
}

export function createMockLucideModule(
  entries: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    icons: { Activity: mockLucideIcon() },
    createLucideIcon: () => mockLucideIcon(),
    Icon: mockLucideIcon(),
    ...entries,
  }
}
