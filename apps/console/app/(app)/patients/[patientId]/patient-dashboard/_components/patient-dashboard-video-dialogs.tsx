'use client'

import { HeadsetDidNotConfirmDialog } from '@/components/headset-did-not-confirm-dialog'
import { HeadsetReplacementDialog } from '@/components/headset-replacement-dialog'
import { useImmersiveVideoSession } from '@/context/immersive-video-session-context'

export function PatientDashboardVideoDialogs() {
  const { playback, replacementDialogOpen, dismissReplacementDialog } =
    useImmersiveVideoSession()

  return (
    <>
      <HeadsetDidNotConfirmDialog
        intent={playback.state.confirmIntent}
        reason={playback.state.confirmReason}
        onOpenChange={(open) => {
          if (!open) playback.dismissConfirm()
        }}
      />
      <HeadsetReplacementDialog
        open={replacementDialogOpen}
        onOpenChange={(open) => {
          if (!open) dismissReplacementDialog()
        }}
      />
    </>
  )
}
