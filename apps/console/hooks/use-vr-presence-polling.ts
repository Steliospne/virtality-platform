'use client'

import { useEffect, useRef, useState } from 'react'
import type { Device } from '@virtality/db'
import {
  buildDevicePresenceById,
  createPresenceSocket,
  ensurePresenceSocketConnected,
  getPairedDeviceRoomCodes,
  queryVrPresence,
  VR_PRESENCE_POLL_INTERVAL_MS,
  type DeviceVrPresenceStatus,
} from '@/lib/vr-presence'

type UseVrPresencePollingOptions = {
  enabled: boolean
  devices: Pick<Device, 'id' | 'deviceId'>[]
}

export function useVrPresencePolling({
  enabled,
  devices,
}: UseVrPresencePollingOptions): Record<string, DeviceVrPresenceStatus> {
  const [presenceByRoomCode, setPresenceByRoomCode] = useState<
    Record<string, boolean>
  >({})
  const [hasPolled, setHasPolled] = useState(false)
  const devicesRef = useRef(devices)

  useEffect(() => {
    devicesRef.current = devices
  }, [devices])

  useEffect(() => {
    if (!enabled) {
      setPresenceByRoomCode({})
      setHasPolled(false)
      return
    }

    const socket = createPresenceSocket()
    let cancelled = false

    const completePoll = (presence?: Record<string, boolean>) => {
      if (cancelled) {
        return
      }

      if (presence !== undefined) {
        setPresenceByRoomCode(presence)
      }

      setHasPolled(true)
    }

    const pollPresence = async () => {
      const roomCodes = getPairedDeviceRoomCodes(devicesRef.current)
      if (roomCodes.length === 0) {
        completePoll({})
        return
      }

      try {
        await ensurePresenceSocketConnected(socket)
        const response = await queryVrPresence(socket, roomCodes)
        completePoll(response.presence)
      } catch {
        completePoll()
      }
    }

    void pollPresence()
    const intervalId = setInterval(() => {
      void pollPresence()
    }, VR_PRESENCE_POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(intervalId)
      socket.disconnect()
    }
  }, [enabled])

  return buildDevicePresenceById(devices, presenceByRoomCode, hasPolled)
}
