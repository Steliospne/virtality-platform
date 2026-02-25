'use client'

import { useState, useEffect } from 'react'
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
import { ROOM_EVENT, VRDevice } from '@/types/models'
import { cn } from '@/lib/utils'

function CastingContent() {
  const { devices, isLoading } = useDeviceContext()
  const [selectedDevice, setSelectedDevice] = useState<VRDevice | null>(null)
  const [connectionLoading, setConnectionLoading] = useState(false)

  const connected = useSocketConnection({ device: selectedDevice })
  const { startCasting, stopCasting, videoRef, status } = useCastingHandshake(
    selectedDevice?.socket ?? null,
  )

  useEffect(() => {
    const socket = selectedDevice?.socket
    if (!socket) return

    const handleRoomComplete = () => setConnectionLoading(false)
    const handleMemberLeft = () => {}
    const handleRoomJoined = () => setConnectionLoading(false)

    socket.on(ROOM_EVENT.RoomComplete, handleRoomComplete)
    socket.on(ROOM_EVENT.MemberLeft, handleMemberLeft)
    socket.on(ROOM_EVENT.RoomJoined, handleRoomJoined)

    return () => {
      socket.off(ROOM_EVENT.RoomComplete, handleRoomComplete)
      socket.off(ROOM_EVENT.MemberLeft, handleMemberLeft)
      socket.off(ROOM_EVENT.RoomJoined, handleRoomJoined)
    }
  }, [selectedDevice])

  const handleConnect = () => {
    const deviceId = selectedDevice?.data.deviceId
    if (!selectedDevice || !deviceId) return

    if (!connected) {
      selectedDevice.mutations.setDeviceRoomCode(deviceId)
      selectedDevice.socket.connect()
      setConnectionLoading(true)
    } else {
      selectedDevice.socket.disconnect()
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
          {connectionLoading
            ? 'Connecting…'
            : connected
              ? 'Disconnect'
              : 'Connect to room'}
        </Button>

        <span
          className={cn(
            'text-sm',
            connectionLoading
              ? 'text-amber-500'
              : connected
                ? 'text-green-600 dark:text-green-400'
                : 'text-muted-foreground',
          )}
        >
          {connectionLoading
            ? 'Connecting…'
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
