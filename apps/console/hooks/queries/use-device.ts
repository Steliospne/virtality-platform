'use client'
import { getQueryClient } from '@/integrations/tanstack-query/provider'
import { createSocket } from '@/socket'
import {
  ExerciseData,
  GAME_EVENT,
  PROGRAM_EVENT,
  ProgramStartPayload,
  SocketWithQuery,
  VRDevice,
  WarmupPayload,
} from '@/types/models'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useRef, useEffect } from 'react'
import { orpc } from '@/integrations/orpc/client'

export type useDeviceData = ReturnType<typeof useDevice>

const useDevice = () => {
  const { queryClient } = getQueryClient()

  const { data: initialDevices, isLoading } = useQuery(
    orpc.device.list.queryOptions(),
  )

  const createDevice = useMutation(
    orpc.device.create.mutationOptions({
      onError: (error) => {
        console.log(error)
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.device.list.key(),
        })
      },
    }),
  )

  const removeDevice = useMutation(
    orpc.device.delete.mutationOptions({
      onError: (error) => {
        console.log(error)
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.device.list.key(),
        })
      },
    }),
  )
  // Keep a stable socket per device across renders
  const socketsRef = useRef<Map<string, SocketWithQuery>>(new Map())

  // Remove sockets for devices that are no longer present
  useEffect(() => {
    const currentIds = new Set(initialDevices?.map((d) => d.id) ?? [])

    for (const id of Array.from(socketsRef.current.keys())) {
      if (!currentIds.has(id)) {
        const stale = socketsRef.current.get(id)
        try {
          stale?.disconnect()
        } catch {
          // ignore
        }
        socketsRef.current.delete(id)
      }
    }
  }, [initialDevices])

  // Clean up all sockets on unmount
  useEffect(() => {
    const currentSockets = socketsRef.current
    return () => {
      for (const sock of currentSockets.values()) {
        try {
          sock.disconnect()
        } catch {
          // ignore
        }
      }
      currentSockets.clear()
    }
  }, [])

  const devices: VRDevice[] = useMemo(() => {
    return (
      initialDevices?.map((device) => {
        let socket = socketsRef.current.get(device.id)
        if (!socket) {
          socket = createSocket()
          socketsRef.current.set(device.id, socket)
        }

        return {
          data: device,
          socket,
          usedBy: null,
          startWarmup: (payload: WarmupPayload) => {
            socket.emit(PROGRAM_EVENT.WarmupStart, payload)
          },
          endWarmup: () => {
            socket.emit(PROGRAM_EVENT.WarmupEnd)
          },
          programStart: (payload: ProgramStartPayload) => {
            socket.emit(PROGRAM_EVENT.Start, payload)
          },
          programPause: () => {
            socket.emit(PROGRAM_EVENT.Pause)
          },
          programEnd: () => {
            socket.emit(PROGRAM_EVENT.End)
          },
          settingsChange: (payload: ExerciseData) => {
            socket.emit(PROGRAM_EVENT.SettingsChange, payload)
          },
          changeExercise: (payload: string) => {
            socket.emit(PROGRAM_EVENT.ChangeExercise, payload)
          },
          calibrateHeight: () => {
            socket.emit(PROGRAM_EVENT.CalibrateHeight)
          },
          resetPosition: () => {
            socket.emit(PROGRAM_EVENT.ResetPosition)
          },
          sittingChange: (payload: boolean) => {
            socket.emit(PROGRAM_EVENT.SittingChange, payload)
          },
          gameLoad: (payload: { avatarId: number }) => {
            socket.emit(GAME_EVENT.Load, payload)
          },
          gameStart: () => {
            socket.emit(GAME_EVENT.Start)
          },
          gameEnd: () => {
            socket.emit(GAME_EVENT.End)
          },
        }
      }) ?? []
    )
  }, [initialDevices])

  return { devices, devicesLoading: isLoading, removeDevice, createDevice }
}

export default useDevice
