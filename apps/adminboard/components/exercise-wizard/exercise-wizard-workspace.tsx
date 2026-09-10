'use client'

import { ExerciseWizardCancelDialog } from '@/components/exercise-wizard/exercise-wizard-cancel-dialog'
import { ExerciseWizardClassificationStep } from '@/components/exercise-wizard/exercise-wizard-classification-step'
import { ExerciseWizardFooter } from '@/components/exercise-wizard/exercise-wizard-footer'
import { ExerciseWizardIdentityStep } from '@/components/exercise-wizard/exercise-wizard-identity-step'
import { ExerciseWizardMediaStep } from '@/components/exercise-wizard/exercise-wizard-media-step'
import { ExerciseWizardPageHeading } from '@/components/exercise-wizard/exercise-wizard-page-heading'
import { ExerciseWizardReviewStep } from '@/components/exercise-wizard/exercise-wizard-review-step'
import { ExerciseWizardStepper } from '@/components/exercise-wizard/exercise-wizard-stepper'
import { ExerciseWizardSuccessPanel } from '@/components/exercise-wizard/exercise-wizard-success-panel'
import { useExerciseWizardForm } from '@/components/exercise-wizard/use-exercise-wizard-form'
import { Button } from '@/components/ui/button'
import {
  EXERCISE_WIZARD_CREATE_PATH,
  EXERCISE_WIZARD_EXERCISES_PATH,
  EXERCISE_WIZARD_PAGE_TITLE,
} from '@/lib/exercise-wizard-constants'
import {
  canAdvanceExerciseWizardClassificationStep,
  canAdvanceExerciseWizardIdentityStep,
  canAdvanceExerciseWizardMediaStep,
  canEnableExerciseDraftInConsole,
} from '@/lib/exercise-wizard-gates'
import { isExerciseWizardSittingDirty } from '@/lib/exercise-wizard-dirty'
import {
  exerciseDraftToSaveInput,
  formatExerciseDraftOccupancyError,
} from '@/lib/exercise-wizard-save'
import { getErrorMessage } from '@/lib/get-error-message'
import { useExerciseWizardNavigation } from '@/lib/use-exercise-wizard-navigation'
import {
  useCheckExerciseDraftOccupancy,
  useExerciseDraft,
  useExerciseDraftClassificationVocabulary,
  usePromoteExerciseDraft,
  useSaveExerciseDraft,
} from '@virtality/react-query'
import { deriveExerciseNamesFromDraft } from '@virtality/shared/utils'
import { Spinner } from '@virtality/ui/components/spinner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

type ExerciseWizardWorkspaceProps = {
  draftId: string
}

type SuccessState = {
  displayName: string
  rowCount: number
}

export function ExerciseWizardWorkspace({
  draftId,
}: ExerciseWizardWorkspaceProps) {
  const router = useRouter()
  const { data: serverDraft, isPending, isError } = useExerciseDraft(draftId)
  const { data: vocabulary } = useExerciseDraftClassificationVocabulary()
  const { form, patchForm, resetStemFromDisplayName } =
    useExerciseWizardForm(serverDraft)
  const navigation = useExerciseWizardNavigation()
  const saveMutation = useSaveExerciseDraft()
  const occupancyMutation = useCheckExerciseDraftOccupancy()
  const promoteMutation = usePromoteExerciseDraft()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [occupancyError, setOccupancyError] = useState<string | null>(null)
  const [success, setSuccess] = useState<SuccessState | null>(null)

  const isBusy =
    saveMutation.isPending ||
    occupancyMutation.isPending ||
    promoteMutation.isPending

  const canGoNext = useMemo(() => {
    if (!form) {
      return false
    }

    switch (navigation.currentStep) {
      case 'identity':
        return canAdvanceExerciseWizardIdentityStep(form)
      case 'classification':
        return canAdvanceExerciseWizardClassificationStep(form)
      case 'media':
        return canAdvanceExerciseWizardMediaStep()
      default:
        return false
    }
  }, [form, navigation.currentStep])

  const enableReadiness = form
    ? canEnableExerciseDraftInConsole(form)
    : { ready: false as const, missing: [] }

  const persistDraft = async (override?: Partial<NonNullable<typeof form>>) => {
    if (!form) {
      return
    }

    const merged = { ...form, ...override }
    await saveMutation.mutateAsync(exerciseDraftToSaveInput(merged))
  }

  const verifyOccupancy = async (): Promise<boolean> => {
    if (!form) {
      return false
    }

    const candidateNames = deriveExerciseNamesFromDraft(form).map(
      (entry) => entry.name,
    )
    const result = await occupancyMutation.mutateAsync({
      draftId: form.id,
      candidateNames,
    })

    if (result.occupiedNames.length > 0) {
      setOccupancyError(formatExerciseDraftOccupancyError(result.occupiedNames))
      return false
    }

    setOccupancyError(null)
    return true
  }

  const handleNext = async () => {
    if (!form || !canGoNext) {
      return
    }

    try {
      await persistDraft()
      if (navigation.currentStep === 'identity') {
        const ok = await verifyOccupancy()
        if (!ok) {
          return
        }
      }

      navigation.goNext()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save draft.'))
    }
  }

  const handleEnable = async () => {
    if (!form || !enableReadiness.ready) {
      return
    }

    try {
      await persistDraft()
      const ok = await verifyOccupancy()
      if (!ok) {
        return
      }

      const rows = await promoteMutation.mutateAsync({ draftId: form.id })
      setSuccess({
        displayName: form.displayName.trim(),
        rowCount: rows.length,
      })
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not enable exercise.'))
    }
  }

  const handleSaveDraft = async () => {
    try {
      await persistDraft()
      router.push(EXERCISE_WIZARD_EXERCISES_PATH)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save draft.'))
    }
  }

  const handleCancel = () => {
    if (!form || !isExerciseWizardSittingDirty(form)) {
      router.push(EXERCISE_WIZARD_EXERCISES_PATH)
      return
    }

    setCancelOpen(true)
  }

  const handleCreateAnother = () => {
    setSuccess(null)
    navigation.resetToIdentity()
    router.replace(EXERCISE_WIZARD_CREATE_PATH)
  }

  if (isPending || !form) {
    return (
      <div className='flex justify-center p-16'>
        <Spinner className='size-8' />
      </div>
    )
  }

  if (isError) {
    return (
      <div className='p-8'>
        <p className='text-destructive'>Exercise draft could not be loaded.</p>
        <Button asChild variant='outline' className='mt-4'>
          <Link href={EXERCISE_WIZARD_EXERCISES_PATH}>Back to exercises</Link>
        </Button>
      </div>
    )
  }

  if (success) {
    return (
      <div className='p-8'>
        <ExerciseWizardSuccessPanel
          displayName={success.displayName}
          rowCount={success.rowCount}
          onCreateAnother={() => void handleCreateAnother()}
          onBackToExercises={() => router.push(EXERCISE_WIZARD_EXERCISES_PATH)}
        />
      </div>
    )
  }

  return (
    <div className='min-h-screen-with-header flex flex-col'>
      <ExerciseWizardPageHeading title={EXERCISE_WIZARD_PAGE_TITLE} />
      <div className='flex items-center justify-between gap-4 px-8 pt-4'>
        <Button type='button' variant='ghost' asChild>
          <Link href={EXERCISE_WIZARD_EXERCISES_PATH}>← Exercises</Link>
        </Button>
        <Button type='button' variant='outline' onClick={handleCancel}>
          Cancel
        </Button>
      </div>
      <ExerciseWizardStepper
        currentStep={navigation.currentStep}
        canJumpToStep={navigation.canJumpToStep}
        onStepClick={navigation.goToStep}
      />
      <div className='flex-1 px-8 py-8'>
        {navigation.currentStep === 'identity' ? (
          <ExerciseWizardIdentityStep
            values={form}
            occupancyError={occupancyError}
            onChange={(patch) => {
              setOccupancyError(null)
              patchForm(patch)
            }}
            onResetStem={resetStemFromDisplayName}
          />
        ) : null}
        {navigation.currentStep === 'classification' ? (
          <ExerciseWizardClassificationStep
            category={form.category}
            item={form.item}
            categories={vocabulary?.categories ?? []}
            items={vocabulary?.items ?? []}
            onChange={(patch) => patchForm(patch)}
          />
        ) : null}
        {navigation.currentStep === 'media' ? (
          <ExerciseWizardMediaStep
            displayName={form.displayName}
            image={form.image}
            video={form.video}
            onChange={(patch) => {
              patchForm(patch)
              void persistDraft(patch).catch((error) =>
                toast.error(getErrorMessage(error, 'Could not save media.')),
              )
            }}
          />
        ) : null}
        {navigation.currentStep === 'review' ? (
          <ExerciseWizardReviewStep
            draft={form}
            onEditStep={navigation.goToStep}
          />
        ) : null}
      </div>
      <ExerciseWizardFooter
        currentStep={navigation.currentStep}
        canGoNext={canGoNext}
        showReviewActions={navigation.currentStep === 'review'}
        canEnable={enableReadiness.ready}
        isBusy={isBusy}
        onBack={navigation.goBack}
        onNext={() => void handleNext()}
        onSaveDraft={() => void handleSaveDraft()}
        onEnable={() => void handleEnable()}
      />
      <ExerciseWizardCancelDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onConfirmLeave={() => router.push(EXERCISE_WIZARD_EXERCISES_PATH)}
      />
    </div>
  )
}
