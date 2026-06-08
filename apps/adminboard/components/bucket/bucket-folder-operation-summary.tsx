'use client'

import { type BucketFolderOperationOutcome } from '@virtality/shared/utils'

type BucketFolderOperationSummaryProps = {
  outcome: BucketFolderOperationOutcome
}

export function BucketFolderOperationSummary({
  outcome,
}: BucketFolderOperationSummaryProps) {
  return (
    <div className='flex flex-col gap-3 text-sm'>
      <p className='text-green-600'>
        {outcome.successes.length} of {outcome.objectCount} bucket object
        {outcome.objectCount === 1 ? '' : 's'} succeeded.
      </p>

      {outcome.failures.length > 0 ? (
        <div className='flex flex-col gap-2'>
          <p className='font-medium text-red-600'>
            {outcome.failures.length} object
            {outcome.failures.length === 1 ? '' : 's'} failed:
          </p>
          <ul className='list-disc pl-5 text-zinc-600 dark:text-zinc-300'>
            {outcome.failures.map((failure) => (
              <li key={failure.objectKey}>
                <span className='font-mono text-xs'>{failure.objectKey}</span>
                {failure.error ? ` — ${failure.error}` : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
