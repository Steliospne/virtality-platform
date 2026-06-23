'use client'

import { useEffect, useState } from 'react'
import { ROOM_EVENT } from '@virtality/shared/types'
import { createDeviceEmitter, subscribe } from '@/lib/device-event-controller'
import { resolveHeadsetPresentFromDeviceStatus } from '@/lib/vr-headset-presence'
import type { VRDevice } from '@/types/models'

export function useVrHeadsetPresence(device?: VRDevice | null) {
  const [headsetPresent, setHeadsetPresent] = useState(false)

  useEffect(() => {
    const socket = device?.socket
    if (!socket) {
      setHeadsetPresent(false)
      return
    }

    const markAbsent = () => setHeadsetPresent(false)

    if (!socket.connected) {
      markAbsent()
    }

    const emitter = createDeviceEmitter(socket)
    emitter.checkDeviceStatus((response) => {
      setHeadsetPresent(resolveHeadsetPresentFromDeviceStatus(response.status))
    })

    const unsubscribeRoomEvents = subscribe(socket, ROOM_EVENT, {
      RoomComplete: () => setHeadsetPresent(true),
      MemberLeft: markAbsent,
    })

    socket.on('disconnect', markAbsent)

    return () => {
      unsubscribeRoomEvents()
      socket.off('disconnect', markAbsent)
    }
  }, [device])

  return headsetPresent
}
