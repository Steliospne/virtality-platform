'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  useDeviceVideosForUser,
  useImmersiveVideoList,
} from '@virtality/react-query'
import { useDeviceContext } from '@/context/device-context'
import { useHeadsetLibrary } from '@/hooks/use-headset-library'
import { useVrPresencePolling } from '@/hooks/use-vr-presence-polling'
import {
  buildHeadsetLibraryRows,
  countReadyOnHeadset,
  usedBytesOnHeadset,
} from '@/lib/headset-library-rows'
import {
  resolveHeadsetSnapshot,
  selectedHeadsetOnline,
  toCatalogVideos,
  toLibrarySnapshot,
  vrVideoBanner,
  type HeadsetListItem,
} from '@/lib/vr-video-page-state'

export function useVrVideoPage() {
  const { devices } = useDeviceContext()
  const catalogQuery = useImmersiveVideoList()
  const mirrorQuery = useDeviceVideosForUser()
  const catalog = useMemo(
    () => toCatalogVideos(catalogQuery.data?.videos),
    [catalogQuery.data?.videos],
  )
  const mirrorDevices = useMemo(
    () => mirrorQuery.data?.devices ?? [],
    [mirrorQuery.data?.devices],
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const presenceByDeviceId = useVrPresencePolling({
    enabled: true,
    devices: mirrorDevices.map((device) => ({
      id: device.id,
      deviceId: device.deviceId,
    })),
  })

  useEffect(() => {
    if (
      selectedId &&
      mirrorDevices.some((device) => device.id === selectedId)
    ) {
      return
    }
    setSelectedId(mirrorDevices[0]?.id ?? null)
  }, [mirrorDevices, selectedId])

  const selectedMirror = mirrorDevices.find(
    (device) => device.id === selectedId,
  )
  const selectedVrDevice =
    devices.find((device) => device.data.id === selectedId) ?? null

  const library = useHeadsetLibrary(selectedVrDevice)
  const pollOnline = presenceByDeviceId[selectedId ?? ''] === 'online'
  const useLive = library.roomComplete && !library.replaced
  const liveSnapshot = useMemo(
    () =>
      library.libraryState
        ? {
            videos: library.libraryState.videos,
            freeBytes: library.libraryState.freeBytes,
          }
        : { videos: [], freeBytes: 0 },
    [library.libraryState],
  )

  const selectedSnapshot = resolveHeadsetSnapshot({
    live: liveSnapshot,
    mirror: toLibrarySnapshot(selectedMirror?.report),
    online: useLive,
  })

  const rows = buildHeadsetLibraryRows(catalog, selectedSnapshot, useLive)

  const headsets: HeadsetListItem[] = useMemo(() => {
    return mirrorDevices.map((device) => {
      const isSelected = device.id === selectedId
      const snapshot =
        isSelected && useLive ? liveSnapshot : toLibrarySnapshot(device.report)
      const roomOnline = isSelected && library.roomComplete
      const online = roomOnline || presenceByDeviceId[device.id] === 'online'

      return {
        id: device.id,
        name: device.name,
        online,
        readyCount: countReadyOnHeadset(catalog, snapshot),
        totalCount: catalog.length,
        freeBytes: snapshot?.freeBytes ?? device.report?.freeBytes ?? null,
        reportedAt: device.report?.reportedAt ?? null,
        usedBytes: usedBytesOnHeadset(snapshot),
      }
    })
  }, [
    catalog,
    library.roomComplete,
    liveSnapshot,
    mirrorDevices,
    presenceByDeviceId,
    selectedId,
    useLive,
  ])

  const selectedOnline = selectedHeadsetOnline({
    roomComplete: library.roomComplete,
    pollOnline,
  })

  const selectedFreeBytes = selectedSnapshot?.freeBytes ?? null
  const selectedReportedAt = selectedMirror?.report?.reportedAt ?? null

  const banner = selectedMirror
    ? vrVideoBanner({
        roomComplete: library.roomComplete,
        replaced: library.replaced,
        pollOnline,
      })
    : null

  return {
    catalogPending: catalogQuery.isPending || mirrorQuery.isPending,
    headsets,
    selectedId,
    setSelectedId: library.replaced ? () => undefined : setSelectedId,
    selectedName: selectedMirror?.name ?? 'Select a headset',
    selectedOnline,
    selectedFreeBytes,
    selectedReportedAt,
    banner,
    rows,
    roomComplete: library.roomComplete && !library.replaced,
    frozen: library.replaced,
    freeBytes: selectedSnapshot?.freeBytes ?? null,
    replaced: library.replaced,
    replacementDialogOpen: library.replacementDialogOpen,
    confirmReason: library.confirmReason,
    dismissConfirm: library.dismissConfirm,
    dismissReplacementDialog: library.dismissReplacementDialog,
    onDownload: library.sendDownloadStart,
    onPause: library.sendDownloadPause,
    onCancel: library.sendDownloadCancel,
    onDelete: library.sendDelete,
  }
}
