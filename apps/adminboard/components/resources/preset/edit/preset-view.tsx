'use client'
import { fetchPresetById } from '@/data/client/preset'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import PresetForm from '@/components/resources/preset/preset-form'
import { updatePreset } from '@/data/server/preset'
import { getQueryClient } from '@/react-query'
import { Preset, PresetExercise } from '@virtality/db'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import PresetExerciseTable from '@/components/resources/preset/edit/preset-exercise-table'
import { columns } from '@/components/resources/preset/edit/columns'
import { useState } from 'react'

const PresetView = ({ id }: { id: string }) => {
  const queryClient = getQueryClient()
  const router = useRouter()
  const { data: preset } = useSuspenseQuery({
    queryKey: ['preset', id],
    queryFn: () => fetchPresetById(id),
  })

  const { mutate: updatePresetMutation, isPending } = useMutation({
    mutationFn: updatePreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets'] })
      queryClient.invalidateQueries({ queryKey: ['preset', id] })
      router.push('/resources/preset')
    },
    mutationKey: ['updatePreset'],
  })

  const onSubmit = (values: PresetForm) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { presetExercise, ...rest } = preset
    const updatedPreset: Preset = {
      ...rest,
      ...values,
      updatedAt: new Date(),
    }

    // console.log(updatedPreset, tableData.length);

    updatePresetMutation({ data: updatedPreset, exercises: tableData })
  }

  const [tableData, setTableData] = useState<PresetExercise[]>(
    preset?.presetExercise ?? [],
  )

  return (
    <div className='h-screen-with-header flex flex-col gap-2 p-2'>
      <Card className='h-fit w-[500px] min-w-[500px] px-6'>
        <CardHeader className='px-0'>
          <CardTitle>Update Preset</CardTitle>
        </CardHeader>
        <CardContent>
          <PresetForm
            values={preset}
            onSubmit={onSubmit}
            SubmitBtn={
              <CardFooter className='justify-end gap-2 px-0'>
                <Button
                  type='button'
                  onClick={() => router.push('/resources/preset')}
                >
                  Cancel
                </Button>
                <Button disabled={isPending}>
                  {isPending ? 'Saving...' : 'Update'}
                </Button>
              </CardFooter>
            }
          />
        </CardContent>
      </Card>

      <PresetExerciseTable
        data={tableData}
        setData={setTableData}
        columns={columns}
        className='h-fit'
      />
    </div>
  )
}

export default PresetView
