'use client'

import { Button } from '@/components/ui/button'
import { RemovePartnerLogoDialog } from '@/components/partner-logos/remove-partner-logo-dialog'
import { getErrorMessage } from '@/lib/get-error-message'
import type { PartnerLogoListItem } from '@virtality/shared/types'
import { useReorderPartnerLogo } from '@virtality/react-query'
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'

type PartnerLogoCategoryListProps = {
  title: string
  description: string
  logos: PartnerLogoListItem[]
  isLoading?: boolean
  onEdit: (logo: PartnerLogoListItem) => void
}

type PartnerLogoListProps = {
  logos: PartnerLogoListItem[]
  onEdit: (logo: PartnerLogoListItem) => void
}

function PartnerLogoThumb({ src, alt }: { src: string; alt: string }) {
  return (
    // Tiny admin preview; hug intrinsic aspect ratio.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className='block h-12 w-auto max-w-28 rounded' />
  )
}

function PartnerLogoList({ logos, onEdit }: PartnerLogoListProps) {
  const { mutate: reorderPartnerLogo, isPending: isReordering } =
    useReorderPartnerLogo()
  const [logoToRemove, setLogoToRemove] = useState<PartnerLogoListItem | null>(
    null,
  )

  const handleReorder = (
    logo: PartnerLogoListItem,
    direction: 'up' | 'down',
  ) => {
    reorderPartnerLogo(
      { id: logo.id, direction },
      {
        onError: (error: unknown) => {
          toast.error(getErrorMessage(error, 'Failed to reorder partner logo.'))
        },
      },
    )
  }

  return (
    <>
      <ul className='space-y-3'>
        {logos.map((logo, index) => (
          <li
            key={logo.id}
            className='flex items-center gap-4 rounded-lg border p-3'
          >
            <PartnerLogoThumb src={logo.cdnUrl} alt={logo.alt} />
            <div className='min-w-0 flex-1'>
              <p className='font-medium'>{logo.alt}</p>
              <p className='text-muted-foreground truncate font-mono text-xs'>
                {logo.objectKey}
              </p>
            </div>
            <div className='flex shrink-0 items-center gap-1'>
              <Button
                type='button'
                variant='outline'
                size='icon'
                disabled={isReordering || index === 0}
                aria-label={`Move ${logo.alt} up`}
                onClick={() => handleReorder(logo, 'up')}
              >
                <ChevronUp className='size-4' />
              </Button>
              <Button
                type='button'
                variant='outline'
                size='icon'
                disabled={isReordering || index === logos.length - 1}
                aria-label={`Move ${logo.alt} down`}
                onClick={() => handleReorder(logo, 'down')}
              >
                <ChevronDown className='size-4' />
              </Button>
              <Button
                type='button'
                variant='outline'
                size='icon'
                disabled={isReordering}
                aria-label={`Edit ${logo.alt}`}
                onClick={() => onEdit(logo)}
              >
                <Pencil className='size-4' />
              </Button>
              <Button
                type='button'
                variant='outline'
                size='icon'
                aria-label={`Remove ${logo.alt}`}
                onClick={() => setLogoToRemove(logo)}
              >
                <Trash2 className='size-4' />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <RemovePartnerLogoDialog
        open={logoToRemove !== null}
        onOpenChange={(open) => {
          if (!open) {
            setLogoToRemove(null)
          }
        }}
        logo={logoToRemove}
      />
    </>
  )
}

export const PartnerLogoCategoryList = ({
  title,
  description,
  logos,
  isLoading = false,
  onEdit,
}: PartnerLogoCategoryListProps) => {
  let body: ReactNode

  if (isLoading) {
    body = (
      <p className='text-muted-foreground text-sm'>Loading partner logos...</p>
    )
  } else if (logos.length === 0) {
    body = (
      <p className='text-muted-foreground rounded-lg border border-dashed p-6 text-sm'>
        No logos assigned yet.
      </p>
    )
  } else {
    body = <PartnerLogoList logos={logos} onEdit={onEdit} />
  }

  return (
    <section className='space-y-4 rounded-lg border p-6'>
      <div>
        <h2 className='text-xl font-semibold'>{title}</h2>
        <p className='text-muted-foreground mt-1 text-sm'>{description}</p>
      </div>
      {body}
    </section>
  )
}
