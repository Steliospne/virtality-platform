'use client'

import { Button } from '@virtality/ui/components/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useClientT } from '@/i18n/use-client-t'
import { useRouter } from 'next/navigation'
import { H2, P } from '@/components/ui/typography'
import capitalize from 'lodash.capitalize'
import ExerciseLibraryList from '@/components/ui/exercise-library-list'
import ExerciseGrid from '@/components/ui/exercise-grid'
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
  starterTemplateCatalogSelection,
  suggestedProgramNameFromTemplate,
} from '@/lib/starter-template-create'
import { useCatalogFirstAuthoringFlow } from '@/hooks/use-catalog-first-authoring-flow'

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
  const isScratch = editorSource.kind === 'scratch'
  const isTemplate = editorSource.kind === 'template'
  const isCatalogFirstCreate = isScratch || isTemplate
  const {
    isCatalogStep,
    isSelectedListStep,
    goToSelectedList,
    goToCatalog,
    selectedExerciseCountLabel,
  } = useCatalogFirstAuthoringFlow()
  const isCatalogFirstCatalogStep = isCatalogFirstCreate && isCatalogStep
  const isCatalogFirstSelectedListStep =
    isCatalogFirstCreate && isSelectedListStep

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

  const suggestedName = isTemplate
    ? suggestedProgramNameFromTemplate(editorSource.template.name)
    : ''

  const form = useForm<ReusableProgramForm>({
    resolver: zodResolver(ReusableProgramFormSchema),
    defaultValues: { name: suggestedName },
  })

  useEffect(() => {
    if (editorSource.kind !== 'template' || !exercises) return

    const catalogSelection = starterTemplateCatalogSelection(
      editorSource.template.exercises,
      exercises,
      generateUUID,
    )

    updateExercises(withRom(catalogSelection.selectedExercises))
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

  const showProgramNameField = isSelectedListStep

  let secondaryNav: { onClick: () => void; label: string }
  if (isCatalogFirstSelectedListStep) {
    secondaryNav = { onClick: goToCatalog, label: t('btn.back') }
  } else if (onBack) {
    secondaryNav = { onClick: onBack, label: t('btn.back') }
  } else {
    secondaryNav = { onClick: handleCancel, label: t('btn.cancel') }
  }

  if (isCreating || isCreatingExercises || (isTemplate && isLoadingExercises)) {
    return (
      <div className='h-screen-with-nav container mx-auto flex flex-col gap-6 p-8'>
        <LoadingScreen />
      </div>
    )
  }

  if (isCatalogFirstCatalogStep) {
    const selectedCount = selectedExercises.length
    const catalogCopy = isTemplate
      ? {
          heading: 'Build from starter template',
          description:
            'Review the template exercises in the catalog, add or remove variants, then continue to settings.',
        }
      : {
          heading: 'Create program',
          description:
            'Choose exercises from the catalog, then review settings before saving.',
        }

    return (
      <div className='h-screen-with-nav container mx-auto flex flex-col gap-6 p-8'>
        <div className='flex h-full max-h-full flex-col space-y-2 overflow-hidden'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <H2>{catalogCopy.heading}</H2>
              <P className='text-muted-foreground'>{catalogCopy.description}</P>
            </div>

            <div className='flex shrink-0 items-center gap-3'>
              <span className='text-muted-foreground text-sm'>
                {selectedExerciseCountLabel(selectedCount)}
              </span>
              <Button onClick={secondaryNav.onClick}>
                {secondaryNav.label}
              </Button>
              <Button variant='primary' onClick={goToSelectedList}>
                Next
              </Button>
            </div>
          </div>

          <div className='min-h-0 flex-1 overflow-auto'>
            <ExerciseGrid />
          </div>
        </div>
      </div>
    )
  }

  const heading = isTemplate
    ? 'Finalize program from template'
    : 'Create program'

  return (
    <div className='h-screen-with-nav container mx-auto flex flex-col gap-6 p-8'>
      <div className='flex h-full max-h-full flex-col space-y-2 overflow-hidden'>
        <div className='flex justify-between'>
          <H2>{heading}</H2>

          <div className='flex gap-2'>
            <Button onClick={secondaryNav.onClick}>{secondaryNav.label}</Button>
            <Button variant='primary' form='reusableProgramForm'>
              {t('btn.submit')}
            </Button>
          </div>
        </div>
        <Form {...form}>
          <form id='reusableProgramForm' onSubmit={form.handleSubmit(onSubmit)}>
            {showProgramNameField && (
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
            )}
          </form>
        </Form>
        <div className='overflow-auto'>
          <ExerciseLibraryList
            showExerciseLibraryAccess={!isCatalogFirstSelectedListStep}
          />
        </div>
      </div>
    </div>
  )
}

export default ReusableProgramFormView
