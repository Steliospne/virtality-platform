'use client'
import { Button } from '@/components/ui/button'
import { PatientProgramForm } from '@/types/models'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PatientProgramFormSchema } from '@/lib/definitions'
import { PatientProgram } from '@virtality/db'
import { useClientT } from '@/i18n/use-client-t'
import { redirect, useRouter } from 'next/navigation'
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
import { Input } from '@/components/ui/input'
import LoadingScreen from '@/components/ui/loading-screen'
import { useExerciseLibrary } from '@/context/exercise-library-context'
import { useEffect } from 'react'
import useUpdatePatientProgram from '@/hooks/mutations/program/use-update-program'
import { getQueryClient } from '@/integrations/tanstack-query/provider'
import usePatientProgram from '@/hooks/queries/patient-program/use-patient-program'
import useUpdateProgramExercises from '@/hooks/mutations/program-exercise/use-update-program-exercises'
import { orpc } from '@/integrations/orpc/client'

// Types
interface ProgramEditFormProps {
  patientId: string
  programId: PatientProgram['id']
}

const ProgramEditForm = ({ patientId, programId }: ProgramEditFormProps) => {
  const { queryClient } = getQueryClient()
  const router = useRouter()
  const { state, handler } = useExerciseLibrary()

  const { selectedExercises } = state
  const { updateExercises } = handler

  // Queries
  const { data: oldProgram } = usePatientProgram({ id: programId })

  const { t } = useClientT('common')

  const { mutate: updateProgram, isPending: isUpdating } =
    useUpdatePatientProgram({})

  const { mutate: updateProgramExercises } = useUpdateProgramExercises({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.program.list.key(),
      })

      queryClient.invalidateQueries({
        queryKey: orpc.program.find.key({ input: { id: programId } }),
      })

      router.push(`/patients/${patientId}/programs`)
    },
  })

  useEffect(() => {
    updateExercises(oldProgram?.programExercise ?? [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oldProgram])

  const form = useForm<PatientProgramForm>({
    resolver: zodResolver(PatientProgramFormSchema),
    defaultValues: { name: '' },
    values: { name: oldProgram?.name ?? '' },
  })

  const onSubmit = (values: PatientProgramForm) => {
    if (!oldProgram) return

    const program: PatientProgram = {
      ...oldProgram,
      name: values.name === '' ? 'untitled' : values.name,
      updatedAt: new Date(),
    }

    const exercises = selectedExercises.map((ex) => ({
      ...ex,
      programId,
    }))

    updateProgram(program)
    updateProgramExercises({ programId, exercises })
  }

  const handleCancel = () => redirect(`/patients/${patientId}/programs`)

  if (isUpdating)
    return (
      <div className='h-screen-with-nav container mx-auto flex flex-col gap-6 p-4'>
        <LoadingScreen />
      </div>
    )

  return (
    <div className='h-screen-with-nav container mx-auto flex flex-col gap-6 p-4'>
      <div className='flex h-full max-h-full flex-col space-y-2 overflow-hidden'>
        <div className='flex justify-between'>
          <H2>Finalize program</H2>

          <div className='flex gap-2'>
            <Button onClick={handleCancel}>{t('btn.cancel')}</Button>
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
    </div>
  )
}

export default ProgramEditForm
