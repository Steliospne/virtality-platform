'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'
import { Spinner } from '@virtality/ui/components/spinner'
import {
  MosaicMediaPickerDialog,
  type MosaicMediaSelection,
} from '@/components/mosaic/mosaic-media-picker-dialog'
import { formatBucketUploadFileCount } from '@/lib/bucket-upload-display'
import { inferMosaicMediaKindFromContentType } from '@/lib/mosaic-media-picker'
import { getErrorMessage } from '@/lib/get-error-message'
import type { MosaicTrayItem } from '@/lib/mosaic-editor'
import {
  bucketCdnUrl,
  validateBucketTargetPrefix,
} from '@virtality/shared/utils'
import { BucketVideoPreview } from '@/components/bucket/bucket-video-preview'
import { useUploadBucketObjects } from '@virtality/react-query'
import { ImageIcon, Upload } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

type MosaicAddMediaDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddToTray: (items: MosaicTrayItem[]) => void
}

type SourceMode = 'pick' | 'upload'

type PendingTrayMedia = MosaicMediaSelection & {
  alt: string
}

function isSourceMode(value: string): value is SourceMode {
  return value === 'pick' || value === 'upload'
}

function SelectedMediaPreview({
  selection,
  alt,
}: {
  selection: MosaicMediaSelection
  alt: string
}) {
  if (selection.mediaKind === 'image') {
    return (
      <Image
        src={bucketCdnUrl(selection.objectKey)}
        alt={alt || 'Selected media'}
        width={64}
        height={64}
        className='size-16 shrink-0 rounded object-cover'
      />
    )
  }

  return (
    <BucketVideoPreview
      src={bucketCdnUrl(selection.objectKey)}
      label={alt || 'Selected media'}
      className='size-16 shrink-0 rounded'
      fallbackClassName='bg-muted size-16 shrink-0 rounded'
      iconClassName='text-muted-foreground size-8'
    />
  )
}

function toPendingTrayMedia(
  selections: MosaicMediaSelection[],
): PendingTrayMedia[] {
  return selections.map((selection) => ({
    ...selection,
    alt: '',
  }))
}

export const MosaicAddMediaDialog = ({
  open,
  onOpenChange,
  onAddToTray,
}: MosaicAddMediaDialogProps) => {
  const [sourceMode, setSourceMode] = useState<SourceMode>('pick')
  const [pendingItems, setPendingItems] = useState<PendingTrayMedia[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [targetPrefix, setTargetPrefix] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const uploadMutation = useUploadBucketObjects()
  const isUploadPending = uploadMutation.isPending

  const targetPrefixError = useMemo(
    () => validateBucketTargetPrefix(targetPrefix),
    [targetPrefix],
  )

  const resetForm = () => {
    setSourceMode('pick')
    setPendingItems([])
    setPickerOpen(false)
    setTargetPrefix('')
    setSelectedFiles([])
    uploadMutation.reset()
  }

  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  const handlePickConfirm = (selections: MosaicMediaSelection[]) => {
    setPendingItems(toPendingTrayMedia(selections))
    setSourceMode('pick')

    if (selections.length === 1) {
      toast.success('Media selected. Add alt text and move it to the tray.')
      return
    }

    toast.success(
      `${selections.length} media items selected. Add alt text for each, then add them to the tray.`,
    )
  }

  const handleAltChange = (objectKey: string, alt: string) => {
    setPendingItems((current) =>
      current.map((item) =>
        item.objectKey === objectKey ? { ...item, alt } : item,
      ),
    )
  }

  const handleAddToTray = () => {
    if (pendingItems.length === 0) {
      toast.error('Select or upload bucket media before adding to the tray.')
      return
    }

    const missingAlt = pendingItems.some((item) => !item.alt.trim())
    if (missingAlt) {
      toast.error('Alt text is required for every selected item.')
      return
    }

    onAddToTray(
      pendingItems.map((item) => ({
        id: crypto.randomUUID(),
        objectKey: item.objectKey,
        mediaKind: item.mediaKind,
        alt: item.alt.trim(),
      })),
    )
    onOpenChange(false)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    setSelectedFiles(files)
    uploadMutation.reset()
  }

  const handleUpload = async () => {
    if (targetPrefixError) {
      toast.error(targetPrefixError)
      return
    }

    if (selectedFiles.length === 0) {
      toast.error('Select at least one media file to upload.')
      return
    }

    try {
      const outcome = await uploadMutation.mutateAsync({
        targetPrefix,
        files: selectedFiles,
      })

      if (outcome.uploads.length === 0) {
        const firstFailure = outcome.failures[0]
        toast.error(firstFailure?.error ?? 'Upload failed.')
        return
      }

      const selections: MosaicMediaSelection[] = []

      for (const upload of outcome.uploads) {
        const mediaKind = inferMosaicMediaKindFromContentType(
          upload.contentType,
        )

        if (!mediaKind) {
          continue
        }

        selections.push({
          objectKey: upload.objectKey,
          mediaKind,
        })
      }

      if (selections.length === 0) {
        toast.error('Uploaded files are not supported mosaic media types.')
        return
      }

      setPendingItems(toPendingTrayMedia(selections))
      setSelectedFiles([])
      setSourceMode('pick')

      if (outcome.failures.length > 0) {
        toast.warning(
          `${outcome.uploads.length} uploaded, ${outcome.failures.length} failed.`,
        )
      } else if (selections.length === 1) {
        toast.success('Media uploaded. Add alt text and move it to the tray.')
      } else {
        toast.success(
          `${selections.length} media items uploaded. Add alt text for each, then add them to the tray.`,
        )
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Upload failed.'))
    }
  }

  const addButtonLabel =
    pendingItems.length > 1
      ? `Add ${pendingItems.length} to tray`
      : 'Add to tray'

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-w-lg overflow-hidden'>
          <DialogHeader>
            <DialogTitle>Add media to tray</DialogTitle>
            <DialogDescription>
              Pick existing Bucket Objects or upload media into a folder you
              choose, then add them to the staging tray with required alt text.
            </DialogDescription>
          </DialogHeader>

          <div className='flex min-w-0 flex-col gap-4'>
            <Tabs
              value={sourceMode}
              onValueChange={(value) => {
                if (isSourceMode(value)) {
                  setSourceMode(value)
                }
              }}
            >
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='pick' disabled={isUploadPending}>
                  Pick existing
                </TabsTrigger>
                <TabsTrigger value='upload' disabled={isUploadPending}>
                  Upload
                </TabsTrigger>
              </TabsList>

              <TabsContent value='pick' className='space-y-2'>
                <p className='text-sm font-medium'>Bucket Objects</p>
                <Button
                  type='button'
                  variant='outline'
                  disabled={isUploadPending}
                  onClick={() => setPickerOpen(true)}
                >
                  <ImageIcon className='mr-2 size-4' />
                  {pendingItems.length > 0 ? 'Change media' : 'Select media'}
                </Button>
              </TabsContent>

              <TabsContent
                value='upload'
                className='flex min-w-0 flex-col gap-3'
              >
                <div className='flex min-w-0 flex-col gap-2'>
                  <Label htmlFor='mosaic-upload-target'>Target folder</Label>
                  <Input
                    id='mosaic-upload-target'
                    value={targetPrefix}
                    disabled={isUploadPending}
                    onChange={(event) => setTargetPrefix(event.target.value)}
                    placeholder='images/campaigns'
                  />
                  <p className='text-muted-foreground text-xs'>
                    Defaults to the bucket root. Upload into any folder you
                    choose; no mosaic-specific prefix is required.
                  </p>
                  {targetPrefixError ? (
                    <p className='text-sm text-red-500'>{targetPrefixError}</p>
                  ) : null}
                </div>

                <div className='flex min-w-0 flex-col gap-2'>
                  <Label htmlFor='mosaic-upload-files'>Media files</Label>
                  <Input
                    id='mosaic-upload-files'
                    type='file'
                    accept='image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,.mov'
                    multiple
                    className='file:text-foreground text-transparent'
                    disabled={isUploadPending}
                    onChange={handleFileChange}
                  />
                  {selectedFiles.length > 0 ? (
                    <p className='text-muted-foreground text-xs'>
                      {formatBucketUploadFileCount(selectedFiles.length)}
                    </p>
                  ) : null}
                </div>

                <Button
                  type='button'
                  variant='outline'
                  disabled={
                    isUploadPending ||
                    selectedFiles.length === 0 ||
                    Boolean(targetPrefixError)
                  }
                  onClick={handleUpload}
                >
                  {isUploadPending ? (
                    <Spinner />
                  ) : (
                    <Upload className='mr-2 size-4' />
                  )}
                  Upload
                </Button>
              </TabsContent>
            </Tabs>

            {pendingItems.length > 0 ? (
              <ul className='max-h-64 space-y-3 overflow-y-auto'>
                {pendingItems.map((item, index) => (
                  <li
                    key={item.objectKey}
                    className='flex items-start gap-3 rounded-lg border p-3'
                  >
                    <SelectedMediaPreview selection={item} alt={item.alt} />
                    <div className='min-w-0 flex-1 space-y-2'>
                      <p
                        className='text-muted-foreground truncate font-mono text-xs'
                        title={item.objectKey}
                      >
                        {item.objectKey}
                      </p>
                      <div className='space-y-1'>
                        <Label htmlFor={`mosaic-tray-alt-${index}`}>
                          Alt text
                        </Label>
                        <Input
                          id={`mosaic-tray-alt-${index}`}
                          value={item.alt}
                          disabled={isUploadPending}
                          onChange={(event) =>
                            handleAltChange(item.objectKey, event.target.value)
                          }
                          placeholder='Accessible description of the media'
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              disabled={isUploadPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type='button'
              variant='primary'
              disabled={isUploadPending || pendingItems.length === 0}
              onClick={handleAddToTray}
            >
              {addButtonLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MosaicMediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selectionMode='multiple'
        onConfirm={handlePickConfirm}
      />
    </>
  )
}
