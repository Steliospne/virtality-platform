'use client'
import { getQueryClient } from '@/integrations/tanstack-query/provider'
import { createSocket } from '@/socket'
import {
  ExerciseData,
  GAME_EVENT,
  PROGRAM_EVENT,
  ProgramStartPayload,
  VRDevice,
  WarmupPayload,
} from '@/types/models'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
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

  const [devices, setDevices] = useState<VRDevice[]>([])

  const setDeviceRoomCode = (deviceId: string, roomCode: string) => {
    const device = devices.find((device) => device.data.id === deviceId)
    if (device) {
      device.socket.io.opts.query.roomCode = roomCode
    }
  }

  const clearDeviceRoomCode = (deviceId: string) => {
    const device = devices.find((device) => device.data.id === deviceId)
    if (device) {
      device.socket.io.opts.query.roomCode = ''
    }
  }

  useEffect(() => {
    if (!initialDevices) {
      return () => setDevices([])
    }

    const next: VRDevice[] = initialDevices.map((device) => {
      const socket = createSocket()
      return {
        data: device,
        socket,
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
    })

    ;(() => setDevices(next))()
  }, [initialDevices])

  return {
    devices,
    isLoading,
    setDeviceRoomCode,
    clearDeviceRoomCode,
    removeDevice,
    createDevice,
  }
}

export default useDevice
