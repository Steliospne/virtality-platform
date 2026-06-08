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
