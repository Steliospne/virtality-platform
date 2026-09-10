'use client'

import { Button } from '@/components/ui/button'
import { exerciseWizardDraftPath } from '@/lib/exercise-wizard-constants'
import { getErrorMessage } from '@/lib/get-error-message'
import {
  useDiscardExerciseDraft,
  useExerciseDrafts,
} from '@virtality/react-query'
import { Spinner } from '@virtality/ui/components/spinner'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { toast } from 'sonner'

function draftTitle(displayName: string): string {
  const trimmed = displayName.trim()
  return trimmed.length > 0 ? trimmed : 'Untitled draft'
}

export function ExerciseDraftList() {
  const { data: drafts = [], isPending } = useExerciseDrafts()
  const discardMutation = useDiscardExerciseDraft()

  if (isPending) {
    return (
      <div className='flex justify-center py-6'>
        <Spinner className='size-6' />
      </div>
    )
  }

  if (drafts.length === 0) {
    return null
  }

  return (
    <section className='mb-8 rounded-lg border'>
      <div className='border-b px-4 py-3'>
        <h2 className='font-medium'>Exercise drafts</h2>
        <p className='text-muted-foreground text-sm'>
          Shared sittings any admin can resume or discard.
        </p>
      </div>
      <ul className='divide-y'>
        {drafts.map((draft) => (
          <li
            key={draft.id}
            className='flex flex-wrap items-center justify-between gap-3 px-4 py-3'
          >
            <div className='min-w-0'>
              <p className='font-medium'>{draftTitle(draft.displayName)}</p>
              <p className='text-muted-foreground text-xs'>
                Updated{' '}
                {formatDistanceToNow(new Date(draft.updatedAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <div className='flex gap-2'>
              <Button asChild variant='outline' size='sm'>
                <Link href={exerciseWizardDraftPath(draft.id)}>Resume</Link>
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                disabled={discardMutation.isPending}
                onClick={() => {
                  discardMutation.mutate(
                    { id: draft.id },
                    {
                      onSuccess: () => toast.success('Draft discarded.'),
                      onError: (error) =>
                        toast.error(
                          getErrorMessage(error, 'Could not discard draft.'),
                        ),
                    },
                  )
                }}
              >
                Discard
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
