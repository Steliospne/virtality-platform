'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
import { HeadsetReplacementDialog } from '@/components/headset-replacement-dialog'
import { useVrVideoPage } from '@/hooks/use-vr-video-page'
import { headsetStorageSubtitle } from '@/lib/headset-library-format'
import { HeadsetDidNotConfirmDialog } from './headset-did-not-confirm-dialog'
import { HeadsetLibrary } from './headset-library'
import { HeadsetList } from './headset-list'
import { VrVideoPageSkeleton } from './vr-video-page-skeleton'
import usePageViewTracking from '@/hooks/analytics/use-page-view-tracking'

export function VrVideoPage() {
  usePageViewTracking({
    props: { route_group: 'device' },
  })
  const page = useVrVideoPage()
  const subtitle = headsetStorageSubtitle({
    online: page.selectedOnline,
    freeBytes: page.selectedFreeBytes,
    reportedAt: page.selectedReportedAt,
  })

  if (page.catalogPending) return <VrVideoPageSkeleton />

  return (
    <div className='flex flex-col gap-6 p-8'>
      <div className='grid gap-4 lg:grid-cols-3'>
        <Card className='lg:col-span-1'>
          <CardHeader>
            <CardTitle>Headsets</CardTitle>
          </CardHeader>
          <CardContent>
            <HeadsetList
              headsets={page.headsets}
              selectedId={page.selectedId}
              onSelect={page.setSelectedId}
            />
          </CardContent>
        </Card>
        <Card className='lg:col-span-2'>
          <CardContent className='pt-6'>
            {page.selectedId ? (
              <HeadsetLibrary
                name={page.selectedName}
                online={page.selectedOnline}
                subtitle={subtitle}
                banner={page.banner}
                rows={page.rows}
                roomComplete={page.roomComplete}
                frozen={page.frozen}
                freeBytes={page.freeBytes}
                onDownload={page.onDownload}
                onPause={page.onPause}
                onCancel={page.onCancel}
                onDelete={page.onDelete}
              />
            ) : (
              <p className='text-muted-foreground text-sm'>
                Select a headset to manage its library.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <HeadsetDidNotConfirmDialog
        reason={page.confirmReason}
        onOpenChange={(open) => {
          if (!open) page.dismissConfirm()
        }}
      />
      <HeadsetReplacementDialog
        open={page.replacementDialogOpen}
        onOpenChange={(open) => {
          if (!open) page.dismissReplacementDialog()
        }}
      />
    </div>
  )
}
