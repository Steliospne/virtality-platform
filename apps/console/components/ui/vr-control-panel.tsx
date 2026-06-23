import { CheckCircle, Loader2, X } from 'lucide-react'
import { Button } from '@virtality/ui/components/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import { VRDevice } from '@/types/models'
import { MouseEvent } from 'react'
import useSocketConnection, {
  type SocketConnectionState,
} from '@/hooks/use-socket-connection'
import { useStore } from 'tinybase/ui-react'
import ErrorToasty from './ErrorToasty'
import { cn } from '@/lib/utils'
import { usePatientDashboard } from '@/context/patient-dashboard-context'
import { useVrPresencePolling } from '@/hooks/use-vr-presence-polling'
import { isDashboardDeviceSelectable } from '@/lib/patient-dashboard-device-selection'
import type { DeviceVrPresenceStatus } from '@/lib/vr-presence'

function isDashboardDeviceRowDisabled(device: VRDevice): boolean {
  return device.socket.connected || !isDashboardDeviceSelectable(device.data)
}

function getClientConnectionBadgeClass(
  connectionState: SocketConnectionState,
  connected: boolean,
): string {
  if (connectionState === 'connecting' || connectionState === 'reconnecting') {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
  }

  return connected
    ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300'
    : 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300'
}

function getClientConnectionLabel(
  connectionState: SocketConnectionState,
  reconnectAttempt: number,
  connected: boolean,
  connectionError: string | null,
): string {
  switch (connectionState) {
    case 'connecting':
      return 'Connecting...'
    case 'reconnecting':
      return `Reconnecting (${reconnectAttempt}/5)...`
    case 'failed':
      return connectionError ?? 'Connection failed'
    default:
      return connected ? 'Connected' : 'Disconnected'
  }
}

type VRControlPanelProps = {
  devices: VRDevice[]
  isOpen: boolean
}

function DevicePresenceStatus({ status }: { status: DeviceVrPresenceStatus }) {
  const statusClassName =
    'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium'

  switch (status) {
    case 'loading':
      return (
        <span className={cn(statusClassName, 'text-muted-foreground')}>
          <Loader2 className='size-3 animate-spin' />
          Checking
        </span>
      )
    case 'online':
      return (
        <span
          className={cn(
            statusClassName,
            'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300',
          )}
        >
          <span className='size-1.5 rounded-full bg-current' />
          Online
        </span>
      )
    case 'offline':
      return (
        <span
          className={cn(
            statusClassName,
            'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
          )}
        >
          <span className='size-1.5 rounded-full bg-current' />
          Offline
        </span>
      )
    case 'unpaired':
      return (
        <span
          className={cn(
            statusClassName,
            'bg-muted text-muted-foreground dark:bg-zinc-800',
          )}
        >
          Unpaired
        </span>
      )
    default: {
      const unhandledStatus: never = status
      return unhandledStatus
    }
  }
}

const VRControlPanel = ({ devices, isOpen }: VRControlPanelProps) => {
  const { state, handler, patientId } = usePatientDashboard()
  const { selectedDevice } = state
  const { setSelectedDevice } = handler

  const store = useStore()
  const {
    connected,
    connectionState,
    reconnectAttempt,
    connectionError,
    connect,
    disconnect,
  } = useSocketConnection({ device: selectedDevice })
  const presenceByDeviceId = useVrPresencePolling({
    enabled: isOpen,
    devices: devices.map((device) => device.data),
  })

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
    }
  }

  const handleDeviceSelection = (value: string) => {
    const device = devices?.find((device) => device.data.id === value) ?? null
    if (device && !isDashboardDeviceSelectable(device.data)) {
      return
    }
    setSelectedDevice(device)
    store?.setCell('patients', patientId, 'lastHeadset', device?.data.id ?? '')
  }

  const clearDeviceSelection = () => {
    setSelectedDevice(null)
    store?.delCell('patients', patientId, 'lastHeadset')
  }

  const handleDeviceSelectionClear = (e: MouseEvent) => {
    e.stopPropagation()
    clearDeviceSelection()
  }

  const renderClientStatus = (className?: string) => (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium',
        getClientConnectionBadgeClass(connectionState, connected),
        className,
      )}
    >
      {connected && <CheckCircle className='size-3.5' />}
      {(connectionState === 'connecting' ||
        connectionState === 'reconnecting') && (
        <Loader2 className='size-3.5 animate-spin' />
      )}
      {getClientConnectionLabel(
        connectionState,
        reconnectAttempt,
        connected,
        connectionError,
      )}
    </span>
  )

  const renderDeviceSelect = () => (
    <div className='relative'>
      <Select
        value={selectedDevice?.data.id ?? ''}
        onValueChange={handleDeviceSelection}
      >
        <SelectTrigger className='w-full' disabled={connected}>
          <SelectValue placeholder='Select a device' />
        </SelectTrigger>

        <SelectContent className='dark:bg-zinc-700'>
          {devices?.map((device) => {
            return (
              <SelectItem
                disabled={isDashboardDeviceRowDisabled(device)}
                key={device.data.id}
                value={device.data.id}
              >
                <div className='flex w-full items-center justify-between gap-3'>
                  <span>{device.data.name}</span>
                  <DevicePresenceStatus
                    status={presenceByDeviceId[device.data.id] ?? 'unpaired'}
                  />
                </div>
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
  )

  const renderConnectionButton = (className?: string) => (
    <Button
      variant={connected ? 'destructive' : 'primary'}
      onClick={handleVRConnection}
      className={cn('w-full', className)}
    >
      {connected
        ? 'Disconnect'
        : connectionState === 'failed'
          ? 'Retry'
          : 'Connect'}
    </Button>
  )

  return (
    <div className='space-y-4 p-3'>
      <div className='grid grid-cols-[3px_1fr] gap-x-3'>
        <span
          className={cn(
            'rounded-full',
            connected ? 'bg-green-500' : 'bg-red-500',
          )}
        />

        <div className='space-y-5'>
          <div className='space-y-1'>
            <div className='flex items-center justify-between gap-2'>
              <h1 className='text-sm font-semibold'>Client</h1>
              {renderClientStatus()}
            </div>
            <p className='text-muted-foreground text-xs'>
              Console connection to the VR headset.
            </p>
          </div>

          <div className='space-y-2'>
            <h2 className='text-sm font-semibold'>Device</h2>
            {renderDeviceSelect()}
          </div>
        </div>
      </div>

      {renderConnectionButton()}
    </div>
  )
}

export default VRControlPanel
