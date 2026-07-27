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
import { Input } from '@virtality/ui/components/input'
import { Label } from '@virtality/ui/components/label'
import { BucketObjectPickerDialog } from '@/components/email/bucket-object-picker-dialog'
import { DEFAULT_PARTNER_LOGO_CATEGORY } from '@/lib/partner-logos'
import { getErrorMessage } from '@/lib/get-error-message'
import type {
  PartnerLogoCategory,
  PartnerLogoListItem,
} from '@virtality/shared/types'
import { bucketCdnUrl } from '@virtality/shared/utils'
import { useUpdatePartnerLogo } from '@virtality/react-query'
import { ImageIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { PartnerLogoCategorySelect } from '@/components/partner-logos/partner-logo-category-select'

type EditPartnerLogoDialogProps = {
  logo: PartnerLogoListItem | null
  onClose: () => void
}

export const EditPartnerLogoDialog = ({
  logo,
  onClose,
}: EditPartnerLogoDialogProps) => {
  const [objectKey, setObjectKey] = useState('')
  const [alt, setAlt] = useState('')
  const [category, setCategory] = useState<PartnerLogoCategory>(
    DEFAULT_PARTNER_LOGO_CATEGORY,
  )
  const [pickerOpen, setPickerOpen] = useState(false)
  const { mutate: updatePartnerLogo, isPending } = useUpdatePartnerLogo()

  useEffect(() => {
    if (!logo) {
      return
    }

    setObjectKey(logo.objectKey)
    setAlt(logo.alt)
    setCategory(logo.category)
    setPickerOpen(false)
  }, [logo])

  const handleSave = () => {
    if (!logo) {
      return
    }

    const trimmedAlt = alt.trim()

    if (!objectKey) {
      toast.error('Select a bucket image before saving.')
      return
    }

    if (!trimmedAlt) {
      toast.error('Alt text is required.')
      return
    }

    updatePartnerLogo(
      {
        id: logo.id,
        objectKey,
        alt: trimmedAlt,
        category,
      },
      {
        onSuccess: () => {
          toast.success('Partner logo updated.')
          onClose()
        },
        onError: (error: unknown) => {
          toast.error(getErrorMessage(error, 'Failed to update partner logo.'))
        },
      },
    )
  }

  return (
    <>
      <Dialog
        open={logo !== null}
        onOpenChange={(open) => {
          if (!open) {
            onClose()
          }
        }}
      >
        <DialogContent className='max-w-lg overflow-hidden'>
          <DialogHeader>
            <DialogTitle>Edit partner logo</DialogTitle>
            <DialogDescription>
              Change the Bucket Object, alt text, or category. Category changes
              move the logo to the end of the destination list. Changes go live
              immediately.
            </DialogDescription>
          </DialogHeader>

          <div className='flex min-w-0 flex-col gap-4'>
            <div className='flex min-w-0 flex-col gap-2'>
              <p className='text-sm font-medium'>Bucket Object</p>
              <div className='flex items-center gap-3'>
                <Button
                  type='button'
                  variant='outline'
                  disabled={isPending}
                  onClick={() => setPickerOpen(true)}
                >
                  <ImageIcon className='mr-2 size-4' />
                  Change image
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
              {objectKey ? (
                <p
                  className='text-muted-foreground truncate font-mono text-xs'
                  title={objectKey}
                >
                  {objectKey}
                </p>
              ) : null}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='edit-partner-logo-alt'>Alt text</Label>
              <Input
                id='edit-partner-logo-alt'
                value={alt}
                disabled={isPending}
                onChange={(event) => setAlt(event.target.value)}
                placeholder='Accessible description of the logo'
              />
            </div>

            <PartnerLogoCategorySelect
              id='edit-partner-logo-category'
              value={category}
              disabled={isPending}
              onChange={setCategory}
            />
          </div>

          <DialogFooter className='gap-2 sm:justify-end'>
            <Button
              type='button'
              variant='outline'
              disabled={isPending}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type='button'
              variant='primary'
              disabled={isPending}
              onClick={handleSave}
            >
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BucketObjectPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={setObjectKey}
      />
    </>
  )
}
