'use client'

import { Button } from '@virtality/ui/components/button'

export function LibraryCellCancelButton({
  disabled,
  onCancel,
}: {
  disabled: boolean
  onCancel: () => void
}) {
  return (
    <Button
      type='button'
      variant='outline'
      size='sm'
      disabled={disabled}
      onClick={onCancel}
    >
      Cancel
    </Button>
  )
}
