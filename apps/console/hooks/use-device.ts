'use client'
import { createSocket } from '@/socket'
import { VRDevice } from '@/types/models'
import { useEffect, useState } from 'react'
import { useDeviceCore } from '@virtality/react-query'
import { createDeviceEmitter } from '@/lib/device-event-controller'

export type useDeviceData = ReturnType<typeof useDevice>

const useDevice = () => {
  const {
    data: initialDevices,
    createDevice,
    removeDevice,
    isLoading,
  } = useDeviceCore()

  const [devices, setDevices] = useState<VRDevice[]>([])

  useEffect(() => {
    if (!initialDevices) {
      return () => setDevices([])
    }

    const next: VRDevice[] = initialDevices.map((device) => {
      const socket = createSocket()
      return {
        data: device,
        socket,
        mutations: {
          setDeviceRoomCode: (roomCode: string) => {
            socket.io.opts.query.roomCode = roomCode
          },
          clearDeviceRoomCode: () => {
            socket.io.opts.query.roomCode = ''
          },
        },
        events: createDeviceEmitter(socket),
      }
    })

    ;(() => setDevices(next))()
  }, [initialDevices])

  return {
    devices,
    isLoading,
    removeDevice,
    createDevice,
  }
}

export default useDevice
