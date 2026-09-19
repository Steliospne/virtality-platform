'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  useDeviceVideosForUser,
  useImmersiveVideoList,
} from '@virtality/react-query'
import { usePatientDashboard } from '@/context/patient-dashboard-context'
import { useHeadsetLibrary } from '@/hooks/use-headset-library'
import { useImmersiveVideoPlayback } from '@/hooks/use-immersive-video-playback'
import { useVrPresencePolling } from '@/hooks/use-vr-presence-polling'
import {
  buildHeadsetLibraryRows,
  type HeadsetLibraryRow,
} from '@/lib/headset-library-rows'
import {
  resolveHeadsetSnapshot,
  toCatalogVideos,
  toLibrarySnapshot,
} from '@/lib/vr-video-page-state'
import { isReplacementNoticeError } from '@/lib/socket-replacement-notice'
import useSocketConnection from '@/hooks/use-socket-connection'

export type ImmersiveVideoSessionValue = {
  rows: HeadsetLibraryRow[]
  selectedVideoId: string | null
  setSelectedVideoId: (videoId: string | null) => void
  selectedRow: HeadsetLibraryRow | undefined
  playback: ReturnType<typeof useImmersiveVideoPlayback>
  roomComplete: boolean
  replaced: boolean
  replacementDialogOpen: boolean
  dismissReplacementDialog: () => void
  pollOnline: boolean
  frozen: boolean
}

const ImmersiveVideoSessionContext =
  createContext<ImmersiveVideoSessionValue | null>(null)

export function ImmersiveVideoSessionProvider({
  children,
}: {
  children: ReactNode
}) {
  const { state } = usePatientDashboard()
  const { selectedDevice, selectedMode } = state
  const { connectionError, connectionState } = useSocketConnection({
    device: selectedDevice,
  })
  // Both hooks stay mounted so the value keeps its shape, but only listen in
  // Immersive Video mode: the mode selector is locked while a video is
  // Starting/Playing/Paused, so no other mode ever has a video running.
  const immersive = selectedMode === 'immersive'
  const library = useHeadsetLibrary(selectedDevice, {
    autoConnect: false,
    enabled: immersive,
  })
  const replaced =
    library.replaced ||
    (connectionState === 'failed' && isReplacementNoticeError(connectionError))
  const playback = useImmersiveVideoPlayback(selectedDevice, {
    frozen: replaced,
    enabled: immersive,
  })
  const catalogQuery = useImmersiveVideoList()
  const catalog = useMemo(
    () => toCatalogVideos(catalogQuery.data?.videos),
    [catalogQuery.data?.videos],
  )
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null)
  const [replacementAcked, setReplacementAcked] = useState(false)

  const presenceByDeviceId = useVrPresencePolling({
    enabled: Boolean(selectedDevice),
    devices: selectedDevice
      ? [
          {
            id: selectedDevice.data.id,
            deviceId: selectedDevice.data.deviceId,
          },
        ]
      : [],
  })

  // The Library Mirror stands in for the headset until it joins the room, so
  // a downloaded video is offered before the physio connects.
  const mirrorQuery = useDeviceVideosForUser()
  const mirrorReport = mirrorQuery.data?.devices.find(
    (device) => device.id === selectedDevice?.data.id,
  )?.report

  const rows = useMemo(() => {
    const liveSnapshot = library.libraryState
      ? {
          videos: library.libraryState.videos,
          freeBytes: library.libraryState.freeBytes,
        }
      : null
    const online = library.roomComplete && !replaced

    return buildHeadsetLibraryRows(
      catalog,
      resolveHeadsetSnapshot({
        live: liveSnapshot,
        mirror: toLibrarySnapshot(mirrorReport),
        online,
      }),
      online,
    ).filter((row) => row.inCatalog)
  }, [
    catalog,
    library.libraryState,
    library.roomComplete,
    mirrorReport,
    replaced,
  ])

  const selectedRow = rows.find((row) => row.videoId === selectedVideoId)

  useEffect(() => {
    if (playback.state.videoId) {
      setSelectedVideoId(playback.state.videoId)
    }
  }, [playback.state.videoId])

  useEffect(() => {
    if (!replaced) setReplacementAcked(false)
  }, [replaced])

  const replacementDialogOpen = replaced && !replacementAcked

  const value: ImmersiveVideoSessionValue = {
    rows,
    selectedVideoId,
    setSelectedVideoId,
    selectedRow,
    playback,
    roomComplete: library.roomComplete,
    replaced,
    replacementDialogOpen,
    dismissReplacementDialog: () => {
      setReplacementAcked(true)
      library.dismissReplacementDialog()
    },
    pollOnline: presenceByDeviceId[selectedDevice?.data.id ?? ''] === 'online',
    frozen: replaced,
  }

  return (
    <ImmersiveVideoSessionContext.Provider value={value}>
      {children}
    </ImmersiveVideoSessionContext.Provider>
  )
}

export function useImmersiveVideoSession(): ImmersiveVideoSessionValue {
  const ctx = useContext(ImmersiveVideoSessionContext)
  if (!ctx) {
    throw new Error(
      'useImmersiveVideoSession must be used within ImmersiveVideoSessionProvider',
    )
  }
  return ctx
}
