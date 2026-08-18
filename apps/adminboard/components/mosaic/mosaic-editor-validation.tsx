'use client'

import type { MosaicLiveEligibility } from '@virtality/shared/types'

export function MosaicEditorValidation({
  eligibility,
}: {
  eligibility: MosaicLiveEligibility
}) {
  switch (eligibility.status) {
    case 'live':
      return (
        <p className='text-sm text-emerald-700 dark:text-emerald-400'>
          Perfect tiling — ready to publish on save.
        </p>
      )
    case 'empty':
      return (
        <p className='text-muted-foreground text-sm'>
          The board is empty. Saving requires an explicit hide warning.
        </p>
      )
    case 'incomplete':
      return (
        <div className='space-y-2'>
          <p className='text-sm font-medium'>
            This board is not a perfect tiling yet:
          </p>
          <ul className='text-muted-foreground list-disc space-y-1 pl-5 text-sm'>
            {eligibility.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )
  }
}
