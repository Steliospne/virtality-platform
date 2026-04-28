'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DeviceContextProvider,
  useDeviceContext,
} from '@/context/device-context'
import useSocketConnection from '@/hooks/use-socket-connection'
import { useCastingHandshake } from '@/hooks/use-casting-handshake'
import { VRDevice } from '@/types/models'
import { cn } from '@/lib/utils'
import ErrorToasty from '@/components/ui/ErrorToasty'

function CastingContent() {
  const { devices, isLoading } = useDeviceContext()
  const [selectedDevice, setSelectedDevice] = useState<VRDevice | null>(null)

  const {
    connected,
    connectionState,
    reconnectAttempt,
    connect,
    disconnect,
  } = useSocketConnection({ device: selectedDevice })
  const { startCasting, stopCasting, videoRef, status } = useCastingHandshake(
    selectedDevice?.socket ?? null,
  )

  const handleConnect = async () => {
    const deviceId = selectedDevice?.data.deviceId
    if (!selectedDevice || !deviceId) return

    if (!connected) {
      selectedDevice.mutations.setDeviceRoomCode(deviceId)
      try {
        await connect({ timeoutMs: 10_000 })
      } catch (error) {
        ErrorToasty(
          error instanceof Error
            ? error.message
            : 'Unable to connect to casting room.',
        )
      }
    } else {
      disconnect()
    }
  }

  const handleDeviceSelect = (value: string) => {
    const device = devices?.find((d) => d.data.id === value) ?? null
    setSelectedDevice(device)
  }

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center p-4'>
        <p className='text-muted-foreground'>Loading devices…</p>
      </div>
    )
  }

  return (
    <div className='flex min-h-screen flex-col gap-6 p-6'>
      <h1 className='text-2xl font-semibold'>VR Casting (WebRTC)</h1>

      <div className='flex flex-wrap items-center gap-4'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium'>Device:</span>
          <Select
            value={selectedDevice?.data.id ?? ''}
            onValueChange={handleDeviceSelect}
            disabled={connected}
          >
            <SelectTrigger className='w-[220px]'>
              <SelectValue placeholder='Select a device' />
            </SelectTrigger>
            <SelectContent>
              {devices.map((device) => (
                <SelectItem key={device.data.id} value={device.data.id}>
                  {device.data.name} ({device.data.model})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleConnect}
          disabled={!selectedDevice || !selectedDevice.data.deviceId}
          variant={connected ? 'destructive' : 'default'}
        >
          {connectionState === 'connecting'
            ? 'Connecting…'
            : connected
              ? 'Disconnect'
              : connectionState === 'failed'
                ? 'Retry connection'
                : 'Connect to room'}
        </Button>

        <span
          className={cn(
            'text-sm',
            connectionState === 'connecting'
              ? 'text-amber-500'
              : connectionState === 'reconnecting'
                ? 'text-amber-500'
                : connectionState === 'failed'
                  ? 'text-red-500'
              : connected
                ? 'text-green-600 dark:text-green-400'
                : 'text-muted-foreground',
          )}
        >
          {connectionState === 'connecting'
            ? 'Connecting…'
            : connectionState === 'reconnecting'
              ? `Reconnecting (${reconnectAttempt}/5)...`
              : connectionState === 'failed'
                ? 'Connection failed'
            : connected
              ? 'In room'
              : 'Not connected'}
        </span>
      </div>

      <div className='flex flex-wrap items-center gap-4'>
        <Button
          onClick={startCasting}
          disabled={
            !connected || status === 'requesting' || status === 'negotiating'
          }
        >
          Start casting
        </Button>
        <Button
          variant='outline'
          onClick={stopCasting}
          disabled={status === 'idle'}
        >
          Stop casting
        </Button>
        <span className='text-muted-foreground text-sm'>Status: {status}</span>
      </div>

      <div className='flex flex-1 justify-center'>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          controls
          className='max-h-[70vh] w-full max-w-4xl rounded-lg border bg-black object-contain'
        />
      </div>
    </div>
  )
}

export default function CastingPage() {
  return (
    <DeviceContextProvider>
      <CastingContent />
    </DeviceContextProvider>
  )
}
