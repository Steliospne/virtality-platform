import { scheduleAfterDropdownClose } from '@/lib/schedule-after-dropdown-close'
import { useCallback, useState } from 'react'

/**
 * Controlled dropdown state for Radix menus that open dialogs.
 * See apps/adminboard/docs/adr/0002-dropdown-dialog-pointer-events.md.
 */
export function useDropdownMenu() {
  const [open, setOpen] = useState(false)

  const runAfterClose = useCallback((action: () => void) => {
    scheduleAfterDropdownClose(() => setOpen(false), action)
  }, [])

  return { open, setOpen, runAfterClose }
}

export function useDropdownMenuAction<T>(item: T) {
  const { open, setOpen, runAfterClose } = useDropdownMenu()

  const openDialogAction = useCallback(
    (action: (item: T) => void) => () => {
      runAfterClose(() => action(item))
    },
    [item, runAfterClose],
  )

  return { open, setOpen, openDialogAction }
}
