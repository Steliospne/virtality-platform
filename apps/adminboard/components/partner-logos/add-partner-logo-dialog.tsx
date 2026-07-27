'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { BucketObjectPickerDialog } from '@/components/email/bucket-object-picker-dialog'
import {
  DEFAULT_PARTNER_LOGO_CATEGORY,
  getPartnerLogoUploadPrefix,
} from '@/lib/partner-logos'
import { formatBucketUploadFileCount } from '@/lib/bucket-upload-display'
import { getErrorMessage } from '@/lib/get-error-message'
import type { PartnerLogoCategory } from '@virtality/shared/types'
import { bucketCdnUrl } from '@virtality/shared/utils'
import {
  useCreatePartnerLogo,
  usePartnerLogos,
  useUploadBucketObjects,
} from '@virtality/react-query'
import { ImageIcon, Upload } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PartnerLogoCategorySelect } from '@/components/partner-logos/partner-logo-category-select'

type AddPartnerLogoDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type SourceMode = 'pick' | 'upload'

type AssignmentQueue = {
  pendingKeys: string[]
  total: number
}

function isSourceMode(value: string): value is SourceMode {
  return value === 'pick' || value === 'upload'
}

function startAssignmentQueue(objectKeys: string[]): {
  objectKey: string
  queue: AssignmentQueue
} {
  const [firstObjectKey, ...remainingObjectKeys] = objectKeys
  return {
    objectKey: firstObjectKey,
    queue: {
      pendingKeys: remainingObjectKeys,
      total: objectKeys.length,
    },
  }
}

export const AddPartnerLogoDialog = ({
  open,
  onOpenChange,
}: AddPartnerLogoDialogProps) => {
  const [sourceMode, setSourceMode] = useState<SourceMode>('pick')
  const [objectKey, setObjectKey] = useState('')
  const [alt, setAlt] = useState('')
  const [category, setCategory] = useState<PartnerLogoCategory>(
    DEFAULT_PARTNER_LOGO_CATEGORY,
  )
  const [pickerOpen, setPickerOpen] = useState(false)
  const [addAnother, setAddAnother] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [assignmentQueue, setAssignmentQueue] =
    useState<AssignmentQueue | null>(null)
  const { mutate: createPartnerLogo, isPending: isSaving } =
    useCreatePartnerLogo()
  const uploadMutation = useUploadBucketObjects()
  const { data: partnerLogos = [] } = usePartnerLogos()
  const assignedObjectKeys = useMemo(
    () => partnerLogos.map((logo) => logo.objectKey),
    [partnerLogos],
  )

  const isPending = isSaving || uploadMutation.isPending
  const uploadTargetPrefix = getPartnerLogoUploadPrefix(category)
  const hasPendingAssignments = (assignmentQueue?.pendingKeys.length ?? 0) > 0
  const showAssignmentProgress =
    assignmentQueue !== null && assignmentQueue.total > 1
  const assignmentPosition = assignmentQueue
    ? assignmentQueue.total - assignmentQueue.pendingKeys.length
    : 0

  const resetForm = () => {
    setObjectKey('')
    setAlt('')
    setCategory(DEFAULT_PARTNER_LOGO_CATEGORY)
    setPickerOpen(false)
    setAddAnother(false)
    setSelectedFiles([])
    setAssignmentQueue(null)
    setSourceMode('pick')
    uploadMutation.reset()
  }

  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  const advanceToNextAssignment = () => {
    if (!assignmentQueue || assignmentQueue.pendingKeys.length === 0) {
      return false
    }

    const [nextObjectKey, ...remainingKeys] = assignmentQueue.pendingKeys
    setObjectKey(nextObjectKey)
    setAlt('')
    setAssignmentQueue({ ...assignmentQueue, pendingKeys: remainingKeys })
    return true
  }

  const handleSaveSuccess = () => {
    toast.success('Partner logo assigned.')

    if (advanceToNextAssignment()) {
      return
    }

    if (addAnother) {
      resetForm()
      return
    }

    onOpenChange(false)
  }

  const handleSave = () => {
    const trimmedAlt = alt.trim()

    if (!objectKey) {
      toast.error('Select or upload a bucket image before saving.')
      return
    }

    if (!trimmedAlt) {
      toast.error('Alt text is required.')
      return
    }

    createPartnerLogo(
      {
        objectKey,
        alt: trimmedAlt,
        category,
      },
      {
        onSuccess: handleSaveSuccess,
        onError: (error: unknown) => {
          toast.error(getErrorMessage(error, 'Failed to assign partner logo.'))
        },
      },
    )
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    setSelectedFiles(files)
    uploadMutation.reset()
  }

  const beginAssignmentQueue = (objectKeys: string[]) => {
    if (objectKeys.length === 0) {
      return
    }

    const { objectKey: firstObjectKey, queue } =
      startAssignmentQueue(objectKeys)
    setObjectKey(firstObjectKey)
    setAlt('')
    setAssignmentQueue(queue)
    setSourceMode('pick')
  }

  const handlePickConfirm = (objectKeys: string[]) => {
    beginAssignmentQueue(objectKeys)

    if (objectKeys.length === 1) {
      toast.success('Image selected. Add alt text and save to assign.')
      return
    }

    toast.success(`${objectKeys.length} images selected. Assign each in turn.`)
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Select at least one image to upload.')
      return
    }

    try {
      const outcome = await uploadMutation.mutateAsync({
        targetPrefix: uploadTargetPrefix,
        files: selectedFiles,
      })

      if (outcome.uploads.length === 0) {
        const firstFailure = outcome.failures[0]
        toast.error(firstFailure?.error ?? 'Upload failed.')
        return
      }

      const uploadedObjectKeys = outcome.uploads.map(
        (upload) => upload.objectKey,
      )
      beginAssignmentQueue(uploadedObjectKeys)
      setSelectedFiles([])

      const uploadedCount = outcome.uploads.length
      const failedCount = outcome.failures.length

      if (failedCount > 0) {
        toast.warning(`${uploadedCount} uploaded, ${failedCount} failed.`)
      } else if (uploadedCount === 1) {
        toast.success('Logo uploaded. Add alt text and save to assign.')
      } else {
        toast.success(`${uploadedCount} logos uploaded. Assign each in turn.`)
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Upload failed.'))
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-w-lg overflow-hidden'>
          <DialogHeader>
            <DialogTitle>Add partner logo</DialogTitle>
            <DialogDescription>
              Pick existing Bucket Objects or upload new images, set alt text,
              and choose whether each appears in the strategic or clinical list.
              Changes go live immediately.
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
                <TabsTrigger value='pick' disabled={isPending}>
                  Pick existing
                </TabsTrigger>
                <TabsTrigger value='upload' disabled={isPending}>
                  Upload
                </TabsTrigger>
              </TabsList>

              <TabsContent value='pick' className='space-y-2'>
                <p className='text-sm font-medium'>Bucket Object</p>
                <div className='flex items-center gap-3'>
                  <Button
                    type='button'
                    variant='outline'
                    disabled={isPending}
                    onClick={() => setPickerOpen(true)}
                  >
                    <ImageIcon className='mr-2 size-4' />
                    {objectKey ? 'Change image' : 'Select images'}
                  </Button>
                  {objectKey ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={bucketCdnUrl(objectKey)}
                      alt={alt || 'Selected logo'}
                      className='block h-12 w-auto max-w-28 rounded'
                    />
                  ) : null}
                </div>
              </TabsContent>

              <TabsContent
                value='upload'
                className='flex min-w-0 flex-col gap-3'
              >
                <div className='flex min-w-0 flex-col gap-2'>
                  <Label htmlFor='partner-logo-upload-files'>Images</Label>
                  <Input
                    id='partner-logo-upload-files'
                    type='file'
                    accept='image/*'
                    multiple
                    className='file:text-foreground text-transparent'
                    disabled={isPending}
                    onChange={handleFileChange}
                  />
                  {selectedFiles.length > 0 ? (
                    <div className='flex min-w-0 flex-col gap-1'>
                      <p className='text-muted-foreground text-xs'>
                        {formatBucketUploadFileCount(selectedFiles.length)}
                      </p>
                      <ul className='flex max-h-32 min-w-0 flex-col gap-1 overflow-y-auto'>
                        {selectedFiles.map((file, index) => (
                          <li
                            key={`${index}-${file.name}`}
                            data-testid='partner-logo-upload-selected-file'
                            className='text-muted-foreground truncate text-xs'
                            title={file.name}
                          >
                            {file.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <p className='text-muted-foreground text-xs'>
                  Uploads go to{' '}
                  <span className='font-mono'>{uploadTargetPrefix}/</span> based
                  on the selected category.
                </p>

                <Button
                  type='button'
                  variant='outline'
                  disabled={isPending || selectedFiles.length === 0}
                  onClick={handleUpload}
                >
                  {uploadMutation.isPending ? (
                    <Spinner />
                  ) : (
                    <Upload className='mr-2 size-4' />
                  )}
                  Upload
                  {selectedFiles.length > 1
                    ? ` ${selectedFiles.length} files`
                    : ''}
                </Button>
              </TabsContent>
            </Tabs>

            {objectKey ? (
              <div className='flex min-w-0 flex-col gap-2'>
                <p
                  className='text-muted-foreground truncate font-mono text-xs'
                  title={objectKey}
                >
                  {objectKey}
                </p>
                {showAssignmentProgress ? (
                  <p className='text-muted-foreground text-xs'>
                    Assigning logo {assignmentPosition} of{' '}
                    {assignmentQueue.total}.
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className='space-y-2'>
              <Label htmlFor='partner-logo-alt'>Alt text</Label>
              <Input
                id='partner-logo-alt'
                value={alt}
                disabled={isPending}
                onChange={(event) => setAlt(event.target.value)}
                placeholder='Accessible description of the logo'
              />
            </div>

            <PartnerLogoCategorySelect
              id='partner-logo-category'
              value={category}
              disabled={isPending}
              onChange={setCategory}
            />
          </div>

          <DialogFooter className='flex-col gap-3 sm:flex-col sm:items-stretch'>
            <label className='flex items-center gap-2 text-sm'>
              <Checkbox
                checked={addAnother}
                disabled={isPending || hasPendingAssignments}
                onCheckedChange={(checked) => setAddAnother(checked === true)}
              />
              Add another
            </label>
            <div className='flex justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                disabled={isPending}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type='button'
                variant='primary'
                disabled={isPending}
                onClick={handleSave}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BucketObjectPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selectionMode='multiple'
        onConfirm={handlePickConfirm}
        disabledObjectKeys={assignedObjectKeys}
        disabledReason='Already in use'
      />
    </>
  )
}
