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
import { useEffect, useRef } from 'react'
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
  } = useCatalogFirstAuthoringFlow()

  const { mutateAsync: createReusableProgram } = useCreateReusableProgram({
    onSuccess: (data) => {
      setSelectedProgram(data)
    },
  })

  const { mutate: createReusableProgramExercises } =
    useCreateReusableProgramExercises({
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
        updatePatientDashboardState({
          exercises: withRom(formattedExercises),
          inQuickStart: false,
        })
      },
    })

  const form = useForm<ReusableProgramForm>({
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
  }, [inQuickStart, resetFlow, form])

  const handleOpenChange = (open: boolean) => {
    setInQuickStart(open)
  }

  const canFinalize = canQuickStartFinalAction(
    selectedExercises,
    deferredRemovalIds,
  )

  const continueHandler = () => {
    if (!exerciseInfo) return

    if (!canFinalize) {
      return ErrorToasty(ZERO_ENABLED_VARIANTS_MESSAGE)
    }

    posthog.capture('quickstart_continue')

    resetFlow()
    updateExercises([])

    updatePatientDashboardState({
      inQuickStart: false,
      exercises: applyExercises(exerciseInfo, selectedExercises),
    })
  }

  const saveAsHandler = async (values: ReusableProgramForm) => {
    if (!canFinalize) {
      return ErrorToasty(ZERO_ENABLED_VARIANTS_MESSAGE)
    }

    posthog.capture('quickstart_program_created')

    const { name } = values

    const program = await createReusableProgram({ name })

    const exercises = reusableProgramExercisesForCreateSubmit(
      selectedExercises,
      deferredRemovalIds,
      program.id,
      generateUUID,
    )

    createReusableProgramExercises({
      reusableProgramId: program.id,
      exercises,
    })
  }

  return (
    <Dialog open={inQuickStart} onOpenChange={handleOpenChange}>
      <DialogContent className='flex h-full max-h-4/5 w-4/5 max-w-4/5! flex-col overflow-hidden'>
        <DialogHeader>
          <DialogTitle>Quick Start</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {isCatalogStep
            ? 'Pick some exercise and have the patient working in no time.'
            : 'Tune your selected exercises, then continue or save as a reusable program.'}
        </DialogDescription>

        <div className='flex min-h-0 flex-1 flex-col space-y-4 overflow-hidden'>
          {isCatalogStep ? (
            <div className={scrollableStepContentClass}>
              <ExerciseGrid />
            </div>
          ) : (
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
          )}
        </div>

        <DialogFooter className='items-center gap-2 sm:justify-between'>
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
                Next
                <ArrowRight />
              </Button>
            </>
          )}
          {isSelectedListStep && (
            <>
              <Button type='button' variant='secondary' onClick={goToCatalog}>
                <ArrowLeft />
                Back
              </Button>
              <div className='flex gap-2'>
                <Button
                  type='submit'
                  form='programForm'
                  disabled={!canFinalize}
                >
                  Save Program <Save />
                </Button>
                <Button
                  type='button'
                  variant='primary'
                  onClick={continueHandler}
                  disabled={!canFinalize}
                >
                  Continue
                  <Zap />
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default QuickStartDialog
