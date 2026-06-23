'use client'

import { useEffect, useState } from 'react'
import { ROOM_EVENT } from '@virtality/shared/types'
import { createDeviceEmitter, subscribe } from '@/lib/device-event-controller'
import { resolveHeadsetPresentFromDeviceStatus } from '@/lib/patient-dashboard-treatment-launch'
import type { VRDevice } from '@/types/models'

export function useVrHeadsetPresence(device?: VRDevice | null) {
  const [headsetPresent, setHeadsetPresent] = useState(false)

  useEffect(() => {
    const socket = device?.socket
    if (!socket) {
      setHeadsetPresent(false)
      return
    }

    if (!socket.connected) {
      setHeadsetPresent(false)
    }

    const emitter = createDeviceEmitter(socket)
    emitter.checkDeviceStatus((response) => {
      setHeadsetPresent(resolveHeadsetPresentFromDeviceStatus(response.status))
    })

    const onDisconnect = () => {
      setHeadsetPresent(false)
    }

    const unsubscribeRoomEvents = subscribe(socket, ROOM_EVENT, {
      RoomComplete: () => setHeadsetPresent(true),
      MemberLeft: () => setHeadsetPresent(false),
    })

    socket.on('disconnect', onDisconnect)

    return () => {
      unsubscribeRoomEvents()
      socket.off('disconnect', onDisconnect)
    }
  }, [device])

  return headsetPresent
}
