import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { usePatientDashboard } from '@/context/patient-dashboard-context'
import ExerciseGrid from '@/components/ui/exercise-grid'
import ExerciseLibraryList from '@/components/ui/exercise-library-list'
import { Button } from '@virtality/ui/components/button'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Save, Zap } from 'lucide-react'
import { useExerciseLibrary } from '@/context/exercise-library-context'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ExerciseWithSettings } from '@/types/models'
import {
  ReusableProgramFormSchema,
  ReusableProgramForm,
  reusableProgramExercisesForCreateSubmit,
} from '@/lib/program-library-submit'
import { FormInput } from '@/components/ui/form-v2'
import { Exercise } from '@virtality/db'
import ErrorToasty from '@/components/ui/ErrorToasty'
import { generateUUID } from '@virtality/shared/utils'
import posthog from 'posthog-js'
import {
  getQueryClient,
  useCreateReusableProgram,
  useCreateReusableProgramExercises,
  useExercise,
  useORPC,
} from '@virtality/react-query'
import { withRom } from '@/lib/with-rom'
import { ZERO_ENABLED_VARIANTS_MESSAGE } from '@/lib/program-submit-enabled-variants'
import { useCatalogFirstAuthoringFlow } from '@/hooks/use-catalog-first-authoring-flow'
import { CATALOG_CATALOG_FIRST_AUTHORING_STEP } from '@/lib/catalog-first-authoring-flow'
import { canQuickStartFinalAction } from '@/lib/quickstart-authoring-flow'

const scrollableStepContentClass = 'min-h-0 flex-1 overflow-auto'

const applyExercises = (
  exerciseInfo: Exercise[],
  selectedExercises: ExerciseWithSettings[],
) =>
  selectedExercises.map((selectedExercise) => {
    const exercise = exerciseInfo.find(
      (info) => info.id === selectedExercise.exerciseId,
    )

    return { exercise, ...selectedExercise }
  })

const QuickStartDialog = () => {
  const queryClient = getQueryClient()
  const orpc = useORPC()
  const { data: exerciseInfo } = useExercise()
  const {
    state: { inQuickStart },
    handler: {
      setInQuickStart,
      setSelectedProgram,
      updatePatientDashboardState,
    },
  } = usePatientDashboard()

  const {
    state: { selectedExercises, deferredRemovalIds },
    handler: { updateExercises },
  } = useExerciseLibrary()

  const {
    isCatalogStep,
    isSelectedListStep,
    goToSelectedList,
    goToCatalog,
    resetFlow,
    selectedExerciseCountLabel,
  } = useCatalogFirstAuthoringFlow({
    initialStep: CATALOG_CATALOG_FIRST_AUTHORING_STEP,
  })

  const [savePromptOpen, setSavePromptOpen] = useState(false)
  const savePromptCloseReasonRef = useRef<'continue' | 'save' | null>(null)

  const { mutateAsync: createReusableProgram, isPending: isCreatingProgram } =
    useCreateReusableProgram({
      onSuccess: (data) => {
        setSelectedProgram(data)
      },
    })

  const {
    mutateAsync: createReusableProgramExercises,
    isPending: isCreatingExercises,
  } = useCreateReusableProgramExercises({
    onSuccess: (_, variables) => {
      const formattedExercises = variables.exercises.map((ex) => ({
        id: ex.id,
        exerciseId: ex.exerciseId,
        sets: ex.sets ?? 3,
        reps: ex.reps ?? 10,
        restTime: ex.restTime ?? 5,
        holdTime: ex.holdTime ?? 1,
        speed: ex.speed ?? 1,
      }))

      queryClient.invalidateQueries({
        queryKey: orpc.reusableProgram.list.queryKey(),
      })

      updateExercises([])
      resetFlow()
      savePromptCloseReasonRef.current = 'save'
      setSavePromptOpen(false)
      updatePatientDashboardState({
        exercises: withRom(formattedExercises),
        inQuickStart: false,
      })
    },
  })

  const isSaving = isCreatingProgram || isCreatingExercises

  const form = useForm<ReusableProgramForm>({
    resolver: zodResolver(ReusableProgramFormSchema),
    defaultValues: { name: '' },
  })

  const promptForm = useForm<ReusableProgramForm>({
    resolver: zodResolver(ReusableProgramFormSchema),
    defaultValues: { name: '' },
  })

  const wasInQuickStartRef = useRef(inQuickStart)

  useEffect(() => {
    const wasOpen = wasInQuickStartRef.current
    wasInQuickStartRef.current = inQuickStart

    if (inQuickStart === wasOpen) return

    resetFlow()
    form.reset({ name: '' })
    promptForm.reset({ name: '' })
    setSavePromptOpen(false)
  }, [inQuickStart, resetFlow, form, promptForm])

  const handleOpenChange = (open: boolean) => {
    if (!open && savePromptOpen) return
    setInQuickStart(open)
  }

  const handleSavePromptOpenChange = (open: boolean) => {
    if (isSaving) return
    if (!open) {
      if (savePromptCloseReasonRef.current === null) {
        posthog.capture('quickstart_continue_save_prompt_dismissed')
      }
      savePromptCloseReasonRef.current = null
    }
    setSavePromptOpen(open)
  }

  const canFinalize = canQuickStartFinalAction(
    selectedExercises,
    deferredRemovalIds,
  )

  const continueWithoutSaving = () => {
    if (!exerciseInfo) return

    if (!canFinalize) {
      return ErrorToasty(ZERO_ENABLED_VARIANTS_MESSAGE)
    }

    posthog.capture('quickstart_continue')

    savePromptCloseReasonRef.current = 'continue'
    setSavePromptOpen(false)
    resetFlow()
    updateExercises([])

    updatePatientDashboardState({
      inQuickStart: false,
      exercises: applyExercises(exerciseInfo, selectedExercises),
    })
  }

  const openSavePrompt = () => {
    if (!exerciseInfo) return

    if (!canFinalize) {
      return ErrorToasty(ZERO_ENABLED_VARIANTS_MESSAGE)
    }

    promptForm.reset({ name: form.getValues('name') })
    savePromptCloseReasonRef.current = null
    setSavePromptOpen(true)
    posthog.capture('quickstart_continue_save_prompt_shown')
  }

  const persistProgram = async (values: ReusableProgramForm) => {
    const { name } = values

    const program = await createReusableProgram({ name })

    const exercises = reusableProgramExercisesForCreateSubmit(
      selectedExercises,
      deferredRemovalIds,
      program.id,
      generateUUID,
    )

    await createReusableProgramExercises({
      reusableProgramId: program.id,
      exercises,
    })
  }

  const saveAsHandler = async (values: ReusableProgramForm) => {
    if (!canFinalize) {
      return ErrorToasty(ZERO_ENABLED_VARIANTS_MESSAGE)
    }

    posthog.capture('quickstart_program_created')

    await persistProgram(values)
  }

  const saveFromPrompt = promptForm.handleSubmit(async (values) => {
    if (!canFinalize) {
      return ErrorToasty(ZERO_ENABLED_VARIANTS_MESSAGE)
    }

    posthog.capture('quickstart_continue_save_prompt_saved')
    posthog.capture('quickstart_program_created')

    try {
      await persistProgram(values)
    } catch {
      // Keep the prompt open; mutation error handling surfaces the failure.
    }
  })

  return (
    <>
      <Dialog open={inQuickStart} onOpenChange={handleOpenChange}>
        <DialogContent className='flex h-full max-h-4/5 w-4/5 max-w-4/5! flex-col overflow-hidden'>
          <DialogHeader>
            <DialogTitle>Quick Start</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {isCatalogStep
              ? 'Add or remove exercises, then return to settings.'
              : 'Tune settings, add exercises if you need them, then continue or save as a reusable program.'}
          </DialogDescription>

          <div className='flex min-h-0 flex-1 flex-col space-y-4 overflow-hidden'>
            {isSelectedListStep ? (
              <>
                <form
                  id='programForm'
                  onSubmit={form.handleSubmit(saveAsHandler)}
                >
                  <FormInput
                    name='name'
                    control={form.control}
                    label='Program Name'
                  />
                </form>
                <div className={scrollableStepContentClass}>
                  <ExerciseLibraryList showExerciseLibraryAccess={false} />
                </div>
              </>
            ) : (
              <div className={scrollableStepContentClass}>
                <ExerciseGrid />
              </div>
            )}
          </div>

          <DialogFooter className='items-center gap-2 sm:justify-between'>
            {isSelectedListStep && (
              <>
                <Button type='button' variant='secondary' onClick={goToCatalog}>
                  Add exercises
                  <ArrowRight />
                </Button>
                <div className='flex gap-2'>
                  <Button
                    type='submit'
                    form='programForm'
                    disabled={!canFinalize || isSaving}
                  >
                    Save Program <Save />
                  </Button>
                  <Button
                    type='button'
                    variant='primary'
                    onClick={openSavePrompt}
                    disabled={!canFinalize || isSaving}
                  >
                    Continue
                    <Zap />
                  </Button>
                </div>
              </>
            )}
            {isCatalogStep && (
              <>
                <span className='text-muted-foreground text-sm'>
                  {selectedExerciseCountLabel(selectedExercises.length)}
                </span>
                <Button
                  type='button'
                  variant='primary'
                  onClick={goToSelectedList}
                >
                  <ArrowLeft />
                  Done
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={savePromptOpen} onOpenChange={handleSavePromptOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save this as a program?</DialogTitle>
            <DialogDescription>
              You can save these exercises to your Program Library, or continue
              with a one-off session.
            </DialogDescription>
          </DialogHeader>

          <form id='quickstartSavePromptForm' onSubmit={saveFromPrompt}>
            <fieldset disabled={isSaving}>
              <FormInput
                name='name'
                control={promptForm.control}
                label='Program Name'
              />
            </fieldset>
          </form>

          <DialogFooter>
            <Button
              type='submit'
              form='quickstartSavePromptForm'
              variant='secondary'
              disabled={isSaving}
            >
              Save program
            </Button>
            <Button
              type='button'
              variant='primary'
              onClick={continueWithoutSaving}
              disabled={isSaving}
            >
              Continue without saving
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default QuickStartDialog
