'use client'
import { VRDevice } from '@/types/models'
import { useEffect, useState } from 'react'

const useSocketConnection = ({ device }: { device?: VRDevice | null }) => {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const onDisconnect = () => setConnected(false)

    if (!device) return onDisconnect()

    const onConnect = () => setConnected(true)

    if (device.socket.connected) onConnect()

    device.socket.on('connect', onConnect)
    device.socket.on('disconnect', onDisconnect)

    return () => {
      device.socket.off('connect', onConnect)
      device.socket.off('disconnect', onDisconnect)
    }
  }, [device])

  return connected
}

export default useSocketConnection
