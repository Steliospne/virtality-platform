'use client'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { type PresetForm } from '@/types/models'
import { PresetFormSchema } from '@/lib/definitions'
import capitalize from 'lodash.capitalize'
import ComboSelect from '@/app/(pages)/patient/patient-programs/_components/combo-select'
import { pathologies } from '@/data/static/program-form/data'
import { P } from '@/components/ui/typography'
import { User } from '@/auth-client'
import { getQueryClient } from '@/integrations/tanstack-query/provider'
import ExerciseLibraryList from '@/components/ui/exercise-library-list'
import LoadingScreen from '@/components/ui/loading-screen'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'
import { useExerciseLibrary } from '@/context/exercise-library-context'
import { useClientT } from '@/i18n/use-client-t'
import useCreatePreset from '@/hooks/mutations/preset/use-create-preset'
import { orpc } from '@/integrations/orpc/client'
import useCreatePresetExercises from '@/hooks/mutations/preset-exercise/use-create-preset-exercises'
import { generateUUID } from '@virtality/shared/utils'

const PresetForm = ({ user }: { user: User }) => {
  const { queryClient } = getQueryClient()
  const router = useRouter()
  const { t } = useClientT('common')
  const { state } = useExerciseLibrary()
  const { selectedExercises } = state

  const isEmptyList = selectedExercises.length === 0

  const { mutateAsync: createPreset, isPending: isCreating } = useCreatePreset({
    onSuccess: () => {
      form.reset()

      Promise.all([
        queryClient.invalidateQueries({
          queryKey: orpc.preset.list.key(),
        }),
        queryClient.invalidateQueries({
          queryKey: orpc.preset.listUser.key(),
        }),
      ])

      router.push(`/presets`)
    },
  })

  const { mutateAsync: createPresetExercises } = useCreatePresetExercises({})

  const form = useForm<PresetForm>({
    resolver: zodResolver(PresetFormSchema),
    defaultValues: { presetName: '', start: '', end: '', description: '' },
  })

  const onSubmit = async (values: PresetForm) => {
    if (isEmptyList)
      return toast.error('You need to add at least one exercise.')
    const newPreset = {
      id: generateUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: user.id,
      deletedAt: null,
      ...values,
    }

    const exercises = selectedExercises.map((ex) => {
      return {
        id: generateUUID(),
        presetId: newPreset.id,
        exerciseId: ex.exerciseId,
        sets: ex.sets,
        reps: ex.reps,
        restTime: ex.restTime,
        holdTime: ex.holdTime,
        speed: ex.speed,
        optional: false,
      }
    })

    await createPreset(newPreset)
    await createPresetExercises({ presetId: newPreset.id, exercises })
  }

  if (isCreating) return <LoadingScreen />

  return (
    <div className='container mx-auto mt-10 grid grid-cols-[auto_1fr] grid-rows-[100%] overflow-hidden max-2xl:flex max-2xl:flex-col max-2xl:gap-6'>
      <Form {...form}>
        <form
          id='presetForm'
          onSubmit={form.handleSubmit(onSubmit)}
          className='max-w-lg space-y-4 px-8 max-2xl:px-0'
        >
          <FormField
            name='presetName'
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('Preset Name', { ns: 'preset' }) + ' *'}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder='Preset name'
                    autoComplete='off'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name='description'
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{capitalize(field.name)}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value ?? ''}
                    placeholder='Short description of the preset.'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name='pathology'
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{capitalize(field.name) + ' *'}</FormLabel>
                <FormControl>
                  <ComboSelect
                    value={field.value}
                    term='pathology'
                    onChange={field.onChange}
                    options={pathologies}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='flex flex-col gap-2'>
            <div className='flex items-center justify-between'>
              <FormField
                name='start'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period start</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder='0'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name='end'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period end</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder='2'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <P className='text-muted-foreground text-sm'>
              {'Refers to the specific period of the program [ex. week 0 - 2]'}
            </P>
          </div>
        </form>
      </Form>
      <ExerciseLibraryList />
    </div>
  )
}

export default PresetForm
