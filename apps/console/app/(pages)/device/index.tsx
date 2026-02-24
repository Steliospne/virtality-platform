'use client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import DeviceCard from '@/app/(pages)/device/_components/device-card'
import { DeviceSchema } from '@/lib/definitions'
import { DeviceForm } from '@/types/models'
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Plus } from 'lucide-react'
import DeviceCardSkeleton from './_components/device-card-skeleton'
import { v4 as uuid } from 'uuid'
import { useDeviceContext } from '@/context/device-context'
import useIsAuthed from '@/hooks/use-is-authed'

const defaultValues: DeviceForm = {
  name: '',
  model: 'Meta Quest 3S',
}

const Devices = () => {
  const { isPending } = useIsAuthed()
  const [isDialogOpen, setDialogOpen] = useState(false)
  const { devices, devicesLoading, createDevice } = useDeviceContext()

  const form = useForm<DeviceForm>({
    resolver: zodResolver(DeviceSchema.pick({ name: true, model: true })),
    defaultValues,
  })

  const onSubmit = (values: DeviceForm) => {
    const newDevice = {
      id: uuid(),
      deviceId: null,
      lastUsed: new Date(),
      createdAt: new Date(),
      deletedAt: null,
      ...values,
    }

    createDevice.mutate(newDevice)
    handleDialogOpen()
    form.reset()
  }

  const handleDialogOpen = () => setDialogOpen(!isDialogOpen)

  if (devicesLoading && isPending)
    return (
      <div className='min-h-screen-with-nav'>
        <div className='flex flex-wrap gap-6 p-4'>
          <DeviceCardSkeleton />
          <DeviceCardSkeleton />
          <DeviceCardSkeleton />
        </div>
      </div>
    )

  return (
    <div className='min-h-screen-with-nav'>
      <div className='flex flex-wrap gap-6 p-4'>
        {/* Add Device Card */}
        {!devicesLoading &&
          devices.map((device) => (
            <DeviceCard key={device.data.id} device={device} />
          ))}

        {createDevice.isPending && <DeviceCardSkeleton />}
        <AddDeviceCard handleDialogOpen={handleDialogOpen} />

        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent
            aria-describedby='Form to add a new device.'
            className='sm:max-w-[425px] dark:border-zinc-400 dark:bg-zinc-950 dark:text-zinc-200'
          >
            <DialogHeader>
              <DialogTitle>Add New Device</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-4'
              >
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem className='flex flex-col justify-center'>
                      <FormLabel className='dark:text-vital-blue-400 font-medium text-gray-800'>
                        Device Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          autoComplete='off'
                          placeholder='Enter device name'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className='text-red-500 dark:text-red-500' />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='model'
                  render={({ field }) => (
                    <FormItem id='model'>
                      <FormLabel hidden>Device Model</FormLabel>
                      <Select
                        name='model'
                        onValueChange={field.onChange}
                        defaultValue={field.value ?? ''}
                      >
                        <FormControl>
                          <SelectTrigger className='dark:border-zinc-200 dark:hover:border-zinc-400'>
                            <SelectValue placeholder='Select a model' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className='dark:border-zinc-200 dark:bg-zinc-800'>
                          {/* <SelectItem
                            value='Meta Quest 3'
                            className='dark:hover:bg-zinc-700'
                          >
                            Meta Quest 3
                          </SelectItem> */}
                          <SelectItem
                            value='Meta Quest 3S'
                            className='dark:hover:bg-zinc-700'
                          >
                            Meta Quest 3S
                          </SelectItem>
                          {/* <SelectItem
                            value='Meta Quest Pro'
                            className='dark:hover:bg-zinc-700'
                          >
                            Meta Quest Pro
                          </SelectItem>
                          <SelectItem
                            value='Meta Quest 2'
                            className='dark:hover:bg-zinc-700'
                          >
                            Meta Quest 2
                          </SelectItem> */}
                        </SelectContent>
                      </Select>
                      <FormMessage className='text-red-500 dark:text-red-500' />
                    </FormItem>
                  )}
                />

                <DialogFooter className='pt-4'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handleDialogOpen}
                  >
                    Cancel
                  </Button>
                  <Button type='submit'>Add Device</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default Devices

const AddDeviceCard = ({
  handleDialogOpen,
}: {
  handleDialogOpen: () => void
}) => {
  return (
    <Card
      id='add-new-device'
      onClick={handleDialogOpen}
      className='aspect-4/5 w-full max-w-xs cursor-pointer border-2 border-dashed border-zinc-400 transition-colors hover:border-zinc-200 dark:border-zinc-200 dark:hover:border-zinc-400 dark:hover:bg-zinc-900'
    >
      <CardContent className='m-auto flex h-full flex-col items-center justify-center p-6'>
        <Button className='mb-4 rounded-full p-3! dark:bg-zinc-200'>
          <Plus className='h-6 w-6 text-zinc-200 dark:text-zinc-900' />
        </Button>
        <p className='text-lg font-medium dark:text-zinc-200'>Add device</p>
      </CardContent>
    </Card>
  )
}
