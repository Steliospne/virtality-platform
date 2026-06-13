'use client'

import { Button } from '@virtality/ui/components/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useClientT } from '@/i18n/use-client-t'
import { useRouter } from 'next/navigation'
import { H2 } from '@/components/ui/typography'
import capitalize from 'lodash.capitalize'
import ExerciseLibraryList from '@/components/ui/exercise-library-list'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@virtality/ui/components/input'
import { useExerciseLibrary } from '@/context/exercise-library-context'
import LoadingScreen from '@/components/ui/loading-screen'
import { generateUUID } from '@virtality/shared/utils'
import {
  getQueryClient,
  useORPC,
  useCreateReusableProgram,
  useCreateReusableProgramExercises,
  useExercise,
} from '@virtality/react-query'
import { toast } from 'react-toastify'
import { useEffect } from 'react'
import type { CompleteReusableProgram } from '@/types/models'
import { withRom } from '@/lib/with-rom'
import {
  ReusableProgramFormSchema,
  type ReusableProgramForm,
  canSubmitReusableProgram,
  reusableProgramExercisesForCreateSubmit,
} from '@/lib/program-library-submit'
import { ZERO_ENABLED_VARIANTS_MESSAGE } from '@/lib/program-submit-enabled-variants'
import {
  starterTemplateExercisesForEditor,
  suggestedProgramNameFromTemplate,
} from '@/lib/starter-template-create'

type EditorSource =
  | { kind: 'scratch' }
  | { kind: 'template'; template: CompleteReusableProgram }

interface ReusableProgramFormViewProps {
  editorSource?: EditorSource
  onBack?: () => void
}

const ReusableProgramFormView = ({
  editorSource = { kind: 'scratch' },
  onBack,
}: ReusableProgramFormViewProps) => {
  const queryClient = getQueryClient()
  const orpc = useORPC()
  const router = useRouter()
  const { state, handler } = useExerciseLibrary()
  const { selectedExercises, deferredRemovalIds } = state
  const { updateExercises } = handler
  const { t } = useClientT('common')
  const { data: exercises, isLoading: isLoadingExercises } = useExercise()

  const { mutateAsync: createProgram, isPending: isCreating } =
    useCreateReusableProgram({})

  const { mutate: createProgramExercises, isPending: isCreatingExercises } =
    useCreateReusableProgramExercises({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.reusableProgram.list.key(),
        })

        router.push('/programs')
      },
    })

  const suggestedName =
    editorSource.kind === 'template'
      ? suggestedProgramNameFromTemplate(editorSource.template.name)
      : ''

  const form = useForm<ReusableProgramForm>({
    resolver: zodResolver(ReusableProgramFormSchema),
    defaultValues: { name: suggestedName },
  })

  useEffect(() => {
    if (editorSource.kind !== 'template' || !exercises) return

    const seededExercises = starterTemplateExercisesForEditor(
      editorSource.template.exercises,
      exercises,
      generateUUID,
    )

    updateExercises(withRom(seededExercises))
    form.setValue(
      'name',
      suggestedProgramNameFromTemplate(editorSource.template.name),
    )
    // Seed once when the template editor opens; catalog/template identity only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    editorSource.kind === 'template' ? editorSource.template.id : null,
    exercises,
  ])

  const onSubmit = async (values: ReusableProgramForm) => {
    const submitCheck = canSubmitReusableProgram(
      values.name,
      selectedExercises,
      deferredRemovalIds,
    )

    if (submitCheck.ok === false) {
      if (submitCheck.reason === 'exercises') {
        return toast.error(ZERO_ENABLED_VARIANTS_MESSAGE)
      }
      return
    }

    const program = await createProgram({ name: values.name.trim() })
    const programExercises = reusableProgramExercisesForCreateSubmit(
      selectedExercises,
      deferredRemovalIds,
      program.id,
      generateUUID,
    )

    createProgramExercises({
      reusableProgramId: program.id,
      exercises: programExercises,
    })
  }

  const handleCancel = () => router.push('/programs')

  if (
    isCreating ||
    isCreatingExercises ||
    (editorSource.kind === 'template' && isLoadingExercises)
  ) {
    return (
      <div className='h-screen-with-nav container mx-auto flex flex-col gap-6 p-8'>
        <LoadingScreen />
      </div>
    )
  }

  const heading =
    editorSource.kind === 'template'
      ? 'Finalize program from template'
      : 'Create program'

  return (
    <div className='h-screen-with-nav container mx-auto flex flex-col gap-6 p-8'>
      <div className='flex h-full max-h-full flex-col space-y-2 overflow-hidden'>
        <div className='flex justify-between'>
          <H2>{heading}</H2>

          <div className='flex gap-2'>
            {onBack ? (
              <Button onClick={onBack}>{t('btn.back')}</Button>
            ) : (
              <Button onClick={handleCancel}>{t('btn.cancel')}</Button>
            )}
            <Button variant='primary' form='reusableProgramForm'>
              {t('btn.submit')}
            </Button>
          </div>
        </div>
        <Form {...form}>
          <form id='reusableProgramForm' onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              name='name'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{capitalize(field.name)}</FormLabel>
                  <FormControl>
                    <Input {...field} className='max-w-[250px]' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <div className='overflow-auto'>
          <ExerciseLibraryList />
        </div>
      </div>
    </div>
  )
}

export default ReusableProgramFormView
