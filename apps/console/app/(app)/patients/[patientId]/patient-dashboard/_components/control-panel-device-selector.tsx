import { useState } from 'react'
import { RectangleGoggles, X } from 'lucide-react'
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@virtality/ui/components/button'
import VRControlPanel from '@/components/ui/vr-control-panel'
import { cn } from '@/lib/utils'
import { DeviceContextValue } from '@/context/device-context'

interface DeviceSelectorProps {
  devices: DeviceContextValue['devices']
  connected: boolean
}

const DeviceSelector = ({ devices, connected }: DeviceSelectorProps) => {
  const [openDevicePop, setOpenDevicePop] = useState(false)
  const handleDevicePopover = () => {
    setOpenDevicePop(!openDevicePop)
  }
  return (
    <Popover open={openDevicePop} onOpenChange={setOpenDevicePop}>
      <PopoverTrigger asChild>
        <Button className='items-center gap-2'>
          <RectangleGoggles
            className={cn(
              'size-6 rounded-sm border p-1',
              connected
                ? 'border-green-800/60 bg-green-600/60'
                : 'border-red-800/60 bg-red-600/60',
            )}
          />
          <span className='max-lg:hidden'>Device</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='center'
        side='bottom'
        className='w-108 max-w-[calc(100vw-2rem)] overflow-hidden p-0'
      >
        <div className='flex w-full p-2 pb-0'>
          <Button
            size='icon'
            variant='ghost'
            onClick={handleDevicePopover}
            className='ml-auto size-6'
          >
            <X />
          </Button>
        </div>
        <VRControlPanel devices={devices} isOpen={openDevicePop} />
        <PopoverArrow className='fill-zinc-200 dark:fill-zinc-900' />
      </PopoverContent>
    </Popover>
  )
}

export default DeviceSelector
