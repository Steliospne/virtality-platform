'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PlusSquare } from 'lucide-react'
import { Preset } from '@virtality/db'
import { getUUID } from '@/lib/utils'
import { useMutation } from '@tanstack/react-query'
import { createPreset } from '@/data/server/preset'
import { getQueryClient } from '@/react-query'
import PresetForm from './preset-form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function PresetPopover() {
  const queryClient = getQueryClient()
  const [open, setOpen] = useState(false)

  const { mutate: createPresetMutation, isPending } = useMutation({
    mutationFn: createPreset,
    onSuccess: (data) => {
      setOpen(false)
      queryClient.setQueryData(['presets'], data)
      queryClient.refetchQueries({ queryKey: ['presets'] })
    },
    mutationKey: ['addPreset'],
  })

  const onSubmit = (values: PresetForm) => {
    const newPreset: Preset = {
      id: getUUID(),
      userId: null,
      ...values,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }

    createPresetMutation(newPreset)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='primary' className='ml-auto flex items-center'>
          <PlusSquare />
          New Preset
        </Button>
      </PopoverTrigger>
      <PopoverContent asChild>
        <Card className='w-[500px]'>
          <CardHeader className='px-0'>
            <CardTitle>Create Preset</CardTitle>
          </CardHeader>
          <PresetForm
            onSubmit={onSubmit}
            SubmitBtn={
              <CardFooter className='justify-end gap-2 px-0'>
                <Button type='button' onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button disabled={isPending}>
                  {isPending ? 'Saving...' : 'Create'}
                </Button>
              </CardFooter>
            }
          />
        </Card>
      </PopoverContent>
    </Popover>
  )
}
