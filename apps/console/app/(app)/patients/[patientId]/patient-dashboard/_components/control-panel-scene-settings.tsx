import { useEffect, useState } from 'react'
import { CircleAlert, Settings, X } from 'lucide-react'
import { Separator } from '@virtality/ui/components/separator'
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import MapSelector from './map-selector'
import AvatarSelector from './avatar-selector'
import { PatientDashboardValue } from '@/context/patient-dashboard-context'
import { Button } from '@virtality/ui/components/button'
import { PROGRAM_EVENT } from '@virtality/shared/types'
import { subscribe } from '@/lib/device-event-controller'
import { Switch } from '@/components/ui/switch'
import { Label } from '@virtality/ui/components/label'

interface SceneSettingsProps {
  missingSettings: boolean
  selectedDevice: PatientDashboardValue['state']['selectedDevice']
}

const SceneSettings = ({
  missingSettings,
  selectedDevice,
}: SceneSettingsProps) => {
  const [openSceneSettings, setOpenSceneSettings] = useState(false)
  const [isSitting, setSitting] = useState(false)

  const handleCalibrateHeight = () => {
    selectedDevice?.events.program.CalibrateHeight()
  }

  const handleResetPosition = () => {
    selectedDevice?.events.program.ResetPosition()
  }

  const handleScenePopover = () => {
    setOpenSceneSettings(!openSceneSettings)
  }

  const sittingChangeHandler = (value: boolean) => {
    selectedDevice?.events.program.SittingChange(value)
  }

  const sittingChangeSocketHandler = (payload: boolean) => {
    setSitting(payload)
  }

  useEffect(() => {
    const socket = selectedDevice?.socket
    if (!socket) return

    return subscribe(socket, PROGRAM_EVENT, {
      SittingChange: sittingChangeSocketHandler,
      SittingChangeAck: () => setSitting((prev) => !prev),
    })
  }, [selectedDevice])

  return (
    <Popover open={openSceneSettings} onOpenChange={setOpenSceneSettings}>
      <PopoverTrigger asChild>
        <Button className='relative'>
          {missingSettings && (
            <CircleAlert className='bg-card absolute -top-1.5 -right-1.5 rounded-full text-amber-600' />
          )}
          <span className='max-lg:hidden'>Scene Settings</span>
          <Settings className='hidden max-lg:block' />
        </Button>
      </PopoverTrigger>
      <PopoverContent align='center' side='bottom'>
        <div className='flex w-full'>
          <Button
            size='icon'
            variant='ghost'
            onClick={handleScenePopover}
            className='ml-auto size-6'
          >
            <X />
          </Button>
        </div>
        <div className='flex flex-col gap-2'>
          <div className='flex gap-2 py-2'>
            <Button onClick={handleCalibrateHeight} className='flex-1'>
              Reset Height
            </Button>
            <Button onClick={handleResetPosition} className='flex-1'>
              Reset Position
            </Button>
          </div>
          <div className='flex gap-3'>
            <Switch
              id='sitting'
              checked={isSitting}
              onCheckedChange={sittingChangeHandler}
            />
            <Label htmlFor='sitting'>Sitting</Label>
          </div>
          <h4>Avatar</h4>
          <Separator className='dark:bg-zinc-600' />
          <AvatarSelector />
          <h4>Map</h4>
          <Separator className='dark:bg-zinc-600' />
          <MapSelector />
        </div>
        <PopoverArrow className='fill-zinc-200 dark:fill-zinc-900' />
      </PopoverContent>
    </Popover>
  )
}

export default SceneSettings
