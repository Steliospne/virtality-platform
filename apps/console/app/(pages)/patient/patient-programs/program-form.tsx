'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PatientProgramForm } from '@/types/models'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PatientProgramFormSchema } from '@/lib/definitions'
import { getQueryClient } from '@/integrations/tanstack-query/provider'
import { useClientT } from '@/i18n/use-client-t'
import { useRouter } from 'next/navigation'
import { H2, P } from '@/components/ui/typography'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
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
import { Input } from '@/components/ui/input'
import { useExerciseLibrary } from '@/context/exercise-library-context'
import LoadingScreen from '@/components/ui/loading-screen'

import useExercise from '@/hooks/queries/use-exercise'
import usePresetsByUser from '@/hooks/queries/preset/use-preset-by-user'
import usePresets from '@/hooks/queries/preset/use-presets'
import { orpc } from '@/integrations/orpc/client'
import useCreateProgramExercises from '@/hooks/mutations/program-exercise/use-create-program-exercises'
import useCreateProgram from '@/hooks/mutations/program/use-create-program'
import { generateUUID } from '@virtality/shared/utils'

// Types
interface ProgramFormProps {
  patientId: string
}

const ProgramForm = ({ patientId }: ProgramFormProps) => {
  const { queryClient } = getQueryClient()
  const router = useRouter()
  const { state, handler } = useExerciseLibrary()

  const { selectedExercises } = state
  const { updateExercises } = handler

  const [currentStep, setCurrentStep] = useState(0)

  const { data: exercises } = useExercise()
  const { data: presets } = usePresetsByUser({})
  const { data: userPresets } = usePresets()

  const { t } = useClientT('common')

  const { mutateAsync: createProgram, isPending: isCreating } =
    useCreateProgram({})

  const { mutate: createProgramExercise, isPending: isCreatingExercise } =
    useCreateProgramExercises({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.program.list.key(),
        })

        router.push(`/patients/${patientId}/programs`)
      },
    })

  const form = useForm<PatientProgramForm>({
    resolver: zodResolver(PatientProgramFormSchema),
    defaultValues: { name: '' },
  })

  const onSubmit = async (values: PatientProgramForm) => {
    const { name } = values

    const data = { patientId, name }

    const program = await createProgram(data)

    const exercises = selectedExercises.map((ex) => ({
      id: generateUUID(),
      programId: program.id,
      exerciseId: ex.exerciseId,
      sets: ex.sets,
      reps: ex.reps,
      restTime: ex.restTime,
      holdTime: ex.holdTime,
      speed: ex.speed,
    }))

    createProgramExercise({ programId: program.id, exercises })
  }

  const handleNext = () => {
    setCurrentStep((s) => s + 1)
  }

  const handleBack = () => {
    form.setValue('name', '')
    setCurrentStep((s) => s - 1)
  }

  const handleCancel = () => router.push(`/patients/${patientId}/programs`)

  const fromPreset = (value: string) => {
    if (!presets || !userPresets) return
    const presetToSelect = [...presets, ...userPresets].find(
      (p) => p.id === value,
    )

    if (presetToSelect) {
      handleNext()

      form.setValue('name', presetToSelect.presetName)

      const exercisesFromPreset = presetToSelect.presetExercise.filter((ex) =>
        exercises?.some((de) => de.id === ex.exerciseId && de.enabled),
      )

      const mapped = exercisesFromPreset.map((e) => {
        const defaultEx = exercises?.find((ex) => ex.id === e.exerciseId)
        return { ...e, exercise: defaultEx }
      })

      updateExercises(mapped)
    }
  }

  const fromBlank = () => {
    handleNext()
    updateExercises([])
  }

  const sortedPresets = presets?.sort((a, b) =>
    a.presetName.localeCompare(b.presetName),
  )

  if (isCreating || isCreatingExercise)
    return (
      <div className='h-screen-with-nav container mx-auto flex flex-col gap-6 p-8'>
        <LoadingScreen />
      </div>
    )

  return (
    <div className='h-screen-with-nav container mx-auto flex flex-col gap-6 p-8'>
      {/* Stage 1 */}
      {currentStep === 0 && (
        <div className='flex flex-col gap-4'>
          <div>
            <H2>Crete program</H2>
            <P>Choose to create a blank program or from a preset.</P>
          </div>
          <div className='flex gap-16'>
            <Button onClick={handleCancel}>{t('btn.cancel')}</Button>
            <div className='flex gap-2'>
              <Button variant='outline' onClick={fromBlank}>
                Blank
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button>Preset</Button>
                </PopoverTrigger>
                <PopoverContent className='p-0' align='start'>
                  <Command>
                    <CommandInput
                      placeholder='Search preset...'
                      className='h-9'
                    />
                    <CommandList>
                      <CommandEmpty>No preset found.</CommandEmpty>
                      <CommandGroup heading='Virtality'>
                        {sortedPresets?.map((p) => {
                          return (
                            <CommandItem
                              key={p.id}
                              value={p.id}
                              onSelect={fromPreset}
                            >
                              {capitalize(p.presetName)}
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                      <CommandSeparator />
                      <CommandGroup heading='User'>
                        {userPresets?.map((up) => {
                          return (
                            <CommandItem
                              key={up.id}
                              value={up.id}
                              onSelect={fromPreset}
                            >
                              {capitalize(up.presetName)}
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div className='flex h-full max-h-full flex-col space-y-2 overflow-hidden'>
          <div className='flex justify-between'>
            <H2>Finalize program</H2>

            <div className='flex gap-2'>
              <Button onClick={handleBack}>{t('btn.back')}</Button>
              <Button variant='primary' form='programForm'>
                {t('btn.submit')}
              </Button>
            </div>
          </div>
          <Form {...form}>
            <form id='programForm' onSubmit={form.handleSubmit(onSubmit)}>
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
              ></FormField>
            </form>
          </Form>
          <div className='overflow-auto'>
            <ExerciseLibraryList />
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgramForm
