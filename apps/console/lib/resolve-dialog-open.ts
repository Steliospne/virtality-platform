/**
 * Resolve controlled vs uncontrolled dialog open state.
 * `open={false}` must stay false (do not fall through on falsy).
 */
export function resolveDialogOpen(
  open: boolean | undefined,
  uncontrolledOpen: boolean,
): boolean {
  return open !== undefined ? open : uncontrolledOpen
}
