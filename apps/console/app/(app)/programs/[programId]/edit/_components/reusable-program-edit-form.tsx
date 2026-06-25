'use client'

import { Button } from '@virtality/ui/components/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useClientT } from '@/i18n/use-client-t'
import { redirect, useRouter } from 'next/navigation'
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
import LoadingScreen from '@/components/ui/loading-screen'
import { useExerciseLibrary } from '@/context/exercise-library-context'
import { useEffect } from 'react'
import {
  getQueryClient,
  useExercise,
  useORPC,
  useReusableProgram,
  useUpdateReusableProgram,
  useUpdateReusableProgramExercises,
} from '@virtality/react-query'
import { withRom } from '@/lib/with-rom'
import {
  reusableProgramExercisesForCatalogSeed,
  reusableProgramMetadataForEdit,
} from '@/lib/reusable-program-edit-seed'
import { toast } from 'react-toastify'
import {
  ReusableProgramFormSchema,
  type ReusableProgramForm,
  canSubmitReusableProgram,
  isStarterTemplateProgram,
  reusableProgramExercisesForEditSubmit,
} from '@/lib/program-library-submit'
import { ZERO_ENABLED_VARIANTS_MESSAGE } from '@/lib/program-submit-enabled-variants'
import { useCatalogFirstAuthoringFlow } from '@/hooks/use-catalog-first-authoring-flow'

interface ReusableProgramEditFormProps {
  programId: string
}

const PAGE_SHELL_CLASSNAME =
  'h-screen-with-nav container mx-auto flex flex-col gap-6 p-4'

const ReusableProgramEditForm = ({
  programId,
}: ReusableProgramEditFormProps) => {
  const queryClient = getQueryClient()
  const orpc = useORPC()
  const router = useRouter()
  const { state, handler } = useExerciseLibrary()
  const { selectedExercises, deferredRemovalIds } = state
  const { updateExercises } = handler
  const { t } = useClientT('common')
  const { data: exercises, isLoading: isLoadingExercises } = useExercise()
  const {
    isCatalogStep,
    isSelectedListStep,
    goToSelectedList,
    goToCatalog,
    selectedExerciseCountLabel,
    canGoToSelectedList,
  } = useCatalogFirstAuthoringFlow()

  const { data: existingProgram, isLoading } = useReusableProgram({
    id: programId,
  })

  const { mutate: updateProgram, isPending: isUpdating } =
    useUpdateReusableProgram({})

  const { mutate: updateProgramExercises, isPending: isUpdatingExercises } =
    useUpdateReusableProgramExercises({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.reusableProgram.list.key(),
        })
        queryClient.invalidateQueries({
          queryKey: orpc.reusableProgram.find.key({ input: { id: programId } }),
        })
        router.push('/programs')
      },
    })

  useEffect(() => {
    if (!existingProgram || !exercises) return

    if (isStarterTemplateProgram(existingProgram)) {
      toast.error('Starter templates cannot be edited.')
      router.replace('/programs')
      return
    }

    const seededExercises = reusableProgramExercisesForCatalogSeed(
      existingProgram.exercises,
      exercises,
    )

    updateExercises(withRom(seededExercises))
    // Seed once when the edit form opens; keyed on program id and catalog.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingProgram?.id, exercises])

  const form = useForm<ReusableProgramForm>({
    resolver: zodResolver(ReusableProgramFormSchema),
    defaultValues: { name: '' },
    values: {
      name: existingProgram
        ? reusableProgramMetadataForEdit(existingProgram).name
        : '',
    },
  })

  const onSubmit = (values: ReusableProgramForm) => {
    if (!existingProgram || isStarterTemplateProgram(existingProgram)) return

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

    const programExercises = reusableProgramExercisesForEditSubmit(
      selectedExercises,
      deferredRemovalIds,
      programId,
    )

    updateProgram({ id: programId, name: values.name.trim() })
    updateProgramExercises({
      reusableProgramId: programId,
      exercises: programExercises,
    })
  }

  const handleCancel = () => redirect('/programs')

  const showProgramNameField = isSelectedListStep

  let secondaryNav: { onClick: () => void; label: string }
  if (isSelectedListStep) {
    secondaryNav = { onClick: goToCatalog, label: t('btn.back') }
  } else {
    secondaryNav = { onClick: handleCancel, label: t('btn.cancel') }
  }

  if (isLoading || isLoadingExercises || isUpdating || isUpdatingExercises) {
    return (
      <div className={PAGE_SHELL_CLASSNAME}>
        <LoadingScreen />
      </div>
    )
  }

  if (!existingProgram || isStarterTemplateProgram(existingProgram)) {
    return null
  }

  if (isCatalogStep) {
    const selectedCount = selectedExercises.length

    return (
      <div className={PAGE_SHELL_CLASSNAME}>
        <div className='flex h-full max-h-full flex-col space-y-2 overflow-hidden'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <H2>Edit program</H2>
              <P className='text-muted-foreground'>
                Review exercises in the catalog, then continue to settings
                before saving.
              </P>
            </div>

            <div className='flex shrink-0 items-center gap-3'>
              <span className='text-muted-foreground text-sm'>
                {selectedExerciseCountLabel(selectedCount)}
              </span>
              <Button onClick={secondaryNav.onClick}>
                {secondaryNav.label}
              </Button>
              <Button
                variant='primary'
                onClick={goToSelectedList}
                disabled={!canGoToSelectedList(selectedCount)}
              >
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

  return (
    <div className={PAGE_SHELL_CLASSNAME}>
      <div className='flex h-full max-h-full flex-col space-y-2 overflow-hidden'>
        <div className='flex justify-between'>
          <H2>Edit program</H2>

          <div className='flex gap-2'>
            <Button onClick={secondaryNav.onClick}>{secondaryNav.label}</Button>
            <Button variant='primary' form='reusableProgramEditForm'>
              {t('btn.submit')}
            </Button>
          </div>
        </div>
        <Form {...form}>
          <form
            id='reusableProgramEditForm'
            onSubmit={form.handleSubmit(onSubmit)}
          >
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
          <ExerciseLibraryList showExerciseLibraryAccess={false} />
        </div>
      </div>
    </div>
  )
}

export default ReusableProgramEditForm
