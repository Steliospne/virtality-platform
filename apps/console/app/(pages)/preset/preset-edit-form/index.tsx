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
import { PresetExercise } from '@virtality/db'
import { getQueryClient } from '@/integrations/tanstack-query/provider'
import ExerciseLibraryList from '@/components/ui/exercise-library-list'
import LoadingScreen from '@/components/ui/loading-screen'
import { useExerciseLibrary } from '@/context/exercise-library-context'
import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useClientT } from '@/i18n/use-client-t'
import usePreset from '@/hooks/queries/preset/use-preset'
import useUpdatePreset from '@/hooks/mutations/preset/use-update-preset'
import useUpdatePresetExercises from '@/hooks/mutations/preset-exercise/use-update-preset-exercises'
import { orpc } from '@/integrations/orpc/client'

const PresetEditForm = ({ id }: { id: string }) => {
  const { queryClient } = getQueryClient()
  const router = useRouter()
  const { t } = useClientT('common')
  const { state, handler } = useExerciseLibrary()
  const { selectedExercises } = state
  const { updateExercises } = handler

  const { data: presetData } = usePreset({ id })

  const preset = useMemo(() => {
    if (presetData) {
      const { presetExercise, ...presetInfo } = presetData
      return presetInfo
    }
  }, [presetData])

  const presetExercise = useMemo(() => {
    if (presetData) {
      const { presetExercise, ...presetInfo } = presetData
      return presetExercise
    }
    return []
  }, [presetData])

  useEffect(() => {
    if (preset) updateExercises(presetExercise)
  }, [preset])

  const { mutate: updatePresetMutation, isPending: isUpdating } =
    useUpdatePreset({
      onSuccess: () => {
        form.reset()
        router.push(`/presets`)
        return Promise.all([
          queryClient.invalidateQueries({
            queryKey: orpc.preset.find.key({ input: { id } }),
          }),
          queryClient.invalidateQueries({
            queryKey: orpc.preset.listUser.key(),
          }),
        ])
      },
    })

  const { mutate: updatePresetExercises } = useUpdatePresetExercises({})

  const form = useForm<PresetForm>({
    resolver: zodResolver(PresetFormSchema),
    defaultValues: { presetName: '', start: '', end: '', description: '' },
    values: preset,
  })

  const onSubmit = (values: PresetForm) => {
    const mappedEx = selectedExercises.map((ex) => {
      return { ...ex, presetId: id, optional: false }
    }) as PresetExercise[]

    if (!preset) return

    let updatedExercises = [] as PresetExercise[]
    if (mappedEx.length === 0) {
      updatedExercises = []
    } else {
      updatedExercises = mappedEx
    }

    updatePresetMutation({ ...preset, ...values })

    updatePresetExercises({ presetId: id, exercises: updatedExercises })
  }

  if (isUpdating) return <LoadingScreen />

  return (
    <div className='grid grid-cols-2 grid-rows-[100%] overflow-hidden max-xl:flex max-xl:flex-col max-xl:gap-6'>
      <Form {...form}>
        <form
          id='presetForm'
          onSubmit={form.handleSubmit(onSubmit)}
          className='max-w-lg space-y-4'
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
                <FormLabel>{capitalize(t(`form.${field.name}`))}</FormLabel>
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

export default PresetEditForm
