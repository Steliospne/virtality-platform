import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { usePatientDashboard } from '@/context/patient-dashboard-context'
import ExerciseLibraryList from '@/components/ui/exercise-library-list'
import { Button } from '@virtality/ui/components/button'
import { useState } from 'react'
import { ArrowLeft, ArrowRight, Save, Zap } from 'lucide-react'
import { useExerciseLibrary } from '@/context/exercise-library-context'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
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
import {
  enabledVariantsForSubmit,
  ZERO_ENABLED_VARIANTS_MESSAGE,
} from '@/lib/program-submit-enabled-variants'

const applyExercises = (
  exerciseInfo: Exercise[],
  selectedExercises: ExerciseWithSettings[],
) => {
  const quickStartExercises = selectedExercises.map((se) => {
    const exercise = exerciseInfo.filter((info) => info.id === se.exerciseId)[0]

    return { exercise, ...se }
  })

  return quickStartExercises
}

const QuickStartDialog = () => {
  const queryClient = getQueryClient()
  const orpc = useORPC()
  const [dialogState, setDialogState] = useState(0)
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

  const programDurationEstimate =
    selectedExercises.reduce((prev, next) => {
      const mult = next.reps * next.sets * 4
      const time = prev + next.holdTime + mult + next.restTime
      return time
    }, 0) / 60

  const continueHandler = () => {
    if (!exerciseInfo) return

    posthog.capture('quickstart_continue')

    setDialogState(0)
    updateExercises([])

    updatePatientDashboardState({
      inQuickStart: false,
      exercises: applyExercises(exerciseInfo, selectedExercises),
    })
  }

  const saveAsHandler = async (values: ReusableProgramForm) => {
    if (!values) return

    const enabledVariants = enabledVariantsForSubmit(
      selectedExercises,
      deferredRemovalIds,
    )
    if (enabledVariants.length === 0) {
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

  const backBtnHandler = () => {
    if (dialogState === 0) return
    setDialogState((ps) => ps - 1)
  }
  const nextBtnHandler = () => {
    if (selectedExercises.length === 0)
      return ErrorToasty('You need to pick at least one exercise!')
    setDialogState((ps) => ps + 1)
  }

  return (
    <Dialog open={inQuickStart} onOpenChange={setInQuickStart}>
      <DialogContent className='flex h-full max-h-4/5 max-w-none! flex-col overflow-hidden md:w-3xl xl:w-5xl'>
        <DialogHeader>
          <DialogTitle>Quick Start</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {dialogState === 0
            ? 'Pick some exercise and have the patient working in no time.'
            : 'Choose to save the program for future use or continue to start immediately'}
        </DialogDescription>

        <div className='flex-1 space-y-4 overflow-hidden'>
          {dialogState === 0 ? (
            <ExerciseLibraryList />
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Quickstart Program Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>Number of exercises: {selectedExercises.length}</div>
                  <div>
                    Program duration: ~{Math.floor(programDurationEstimate)} min
                  </div>
                </CardContent>
              </Card>
              <form
                id='programForm'
                onSubmit={form.handleSubmit(saveAsHandler)}
              >
                <FormInput
                  name='name'
                  control={form.control}
                  label={'Program Name'}
                />
              </form>
            </>
          )}
        </div>

        <DialogFooter>
          {dialogState !== 0 && (
            <>
              <Button
                type='button'
                variant='secondary'
                onClick={backBtnHandler}
              >
                <ArrowLeft />
                Back
              </Button>
              <Button type='submit' form='programForm'>
                Save Program <Save />
              </Button>
              <Button type='button' variant='primary' onClick={continueHandler}>
                Continue
                <Zap />
              </Button>
            </>
          )}
          {dialogState === 0 && (
            <Button type='button' variant='primary' onClick={nextBtnHandler}>
              Next
              <ArrowRight />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default QuickStartDialog
