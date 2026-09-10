'use client'

import {
  EXERCISE_WIZARD_EXERCISES_PATH,
  exerciseWizardDraftPath,
} from '@/lib/exercise-wizard-constants'
import { getErrorMessage } from '@/lib/get-error-message'
import { useCreateExerciseDraft } from '@virtality/react-query'
import { Spinner } from '@virtality/ui/components/spinner'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

export default function ExerciseCreateEntryPage() {
  const router = useRouter()
  const createMutation = useCreateExerciseDraft()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) {
      return
    }

    startedRef.current = true
    createMutation
      .mutateAsync(undefined)
      .then((draft) => {
        router.replace(exerciseWizardDraftPath(draft.id))
      })
      .catch((error) => {
        toast.error(getErrorMessage(error, 'Could not start exercise draft.'))
        router.replace(EXERCISE_WIZARD_EXERCISES_PATH)
      })
  }, [createMutation, router])

  return (
    <div className='flex justify-center p-16'>
      <Spinner className='size-8' aria-label='Creating exercise draft' />
    </div>
  )
}
