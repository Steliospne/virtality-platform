import { X } from 'lucide-react'
import { Button } from './button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import { VRDevice } from '@/types/models'
import { useEffect, useState, MouseEvent } from 'react'
import useSocketConnection from '@/hooks/use-socket-connection'
import { useStore } from 'tinybase/ui-react'
import ErrorToasty from './ErrorToasty'
import { cn } from '@/lib/utils'
import { usePatientDashboard } from '@/context/patient-dashboard-context'
import { subscribe, createDeviceEmitter } from '@/lib/device-event-controller'
import { ROOM_EVENT } from '@virtality/shared/types'

const VRControlPanel = ({ devices }: { devices: VRDevice[] }) => {
  const { state, handler, patientId } = usePatientDashboard()
  const { selectedDevice } = state
  const { setSelectedDevice } = handler
  const [deviceConnected, setDeviceConnected] = useState(false)

  const store = useStore()
  const { connected, connectionState, reconnectAttempt, connect, disconnect } =
    useSocketConnection({ device: selectedDevice })

  const handleVRConnection = async () => {
    const deviceId = selectedDevice?.data.deviceId

    if (!selectedDevice || !deviceId) {
      return ErrorToasty('Device not paired.')
    }

    if (!connected) {
      selectedDevice.mutations.setDeviceRoomCode(deviceId)
      try {
        await connect({ timeoutMs: 10_500 })
      } catch (error) {
        ErrorToasty(
          error instanceof Error
            ? error.message
            : 'Unable to connect to device.',
        )
      }
    } else {
      disconnect()
      setDeviceConnected(false)
    }
  }

  const handleDeviceSelection = (value: string) => {
    const device = devices?.find((device) => device.data.id === value) ?? null
    setSelectedDevice(device)
    store?.setCell('patients', patientId, 'lastHeadset', device?.data.id ?? '')
  }

  const handleDeviceSelectionClear = (e: MouseEvent) => {
    e.stopPropagation()
    setSelectedDevice(null)
    store?.delCell('patients', patientId, 'lastHeadset')
  }

  useEffect(() => {
    const socket = selectedDevice?.socket
    if (!socket) return

    const emitter = createDeviceEmitter(socket)
    emitter.checkDeviceStatus((res) => {
      setDeviceConnected(res.status === 'active')
    })

    return subscribe(socket, ROOM_EVENT, {
      RoomComplete: () => setDeviceConnected(true),
      MemberLeft: () => setDeviceConnected(false),
    })
  }, [selectedDevice])

  return (
    <div className='p-2'>
      <h1 className='text-center font-semibold'>VR Headset Connection</h1>
      <div className='flex gap-2'>
        <h4>Client:</h4>
        <span
          className={cn(
            connectionState === 'connecting'
              ? 'text-amber-500'
              : connectionState === 'reconnecting'
                ? 'text-amber-500'
                : connected
                  ? 'text-green-500'
                  : 'text-red-500',
          )}
        >
          {connectionState === 'connecting'
            ? 'Connecting...'
            : connectionState === 'reconnecting'
              ? `Reconnecting (${reconnectAttempt}/5)...`
              : connectionState === 'failed'
                ? 'Connection failed'
                : connected
                  ? 'Online'
                  : 'Offline'}
        </span>
      </div>
      <div className='flex gap-2'>
        <h4>Device:</h4>
        <span
          className={cn(deviceConnected ? 'text-green-500' : 'text-red-500')}
        >
          {deviceConnected ? 'Online' : 'Offline'}
        </span>
      </div>

      <div className='relative'>
        <Select
          value={selectedDevice?.data.id ?? ''}
          onValueChange={handleDeviceSelection}
        >
          <SelectTrigger className='my-4 w-full' disabled={connected}>
            <SelectValue placeholder='Select a device' />
          </SelectTrigger>

          <SelectContent className='dark:bg-zinc-700'>
            {devices?.map((device) => {
              return (
                <SelectItem
                  disabled={device.socket.connected}
                  key={device.data.id}
                  value={device.data.id}
                >
                  {device.data.name}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        {selectedDevice && (
          <Button
            onClick={handleDeviceSelectionClear}
            size='icon'
            variant='ghost'
            disabled={connected}
            className='absolute top-[10px] right-[30px] size-4 rounded-sm hover:bg-zinc-200 hover:dark:bg-zinc-600'
          >
            <X className='p-0.5' />
          </Button>
        )}
      </div>

      <div className='flex flex-col gap-4'>
        <Button variant='primary' onClick={handleVRConnection}>
          {connected
            ? 'Disconnect'
            : connectionState === 'failed'
              ? 'Retry'
              : 'Connect'}
        </Button>
      </div>
    </div>
  )
}

export default VRControlPanel
