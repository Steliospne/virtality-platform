/**
 * Defer an action until after a Radix dropdown has closed.
 *
 * Opening a dialog from a dropdown item while both layers are modal leaves
 * competing `pointer-events` on `document.body` and can make the page
 * unclickable after the dialog closes. Close the menu first, then run the
 * action on the next frame.
 *
 * @see apps/adminboard/docs/adr/0002-dropdown-dialog-pointer-events.md
 */
export type Scheduler = (callback: () => void) => void

export const defaultScheduler: Scheduler = (callback) => {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(callback)
    return
  }

  setTimeout(callback, 0)
}

export function scheduleAfterDropdownClose(
  closeDropdown: () => void,
  action: () => void,
  schedule: Scheduler = defaultScheduler,
): void {
  closeDropdown()
  schedule(action)
}
