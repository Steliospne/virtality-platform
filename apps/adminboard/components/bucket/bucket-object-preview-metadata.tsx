import { cn } from '@/lib/utils'
import type { BucketObjectDetails } from '@virtality/shared/utils'
import { format } from 'date-fns'

function formatSize(size: number | null): string {
  if (size === null) {
    return '—'
  }

  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function formatLastModified(value: string | null): string {
  if (!value) {
    return '—'
  }

  return format(new Date(value), 'MMM d, yyyy HH:mm')
}

function MetadataRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <dt className='text-xs tracking-wide text-white/50 uppercase'>{label}</dt>
      <dd
        className={cn(
          mono
            ? 'font-mono text-xs break-all text-white/70'
            : 'text-sm text-white',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

type BucketObjectPreviewMetadataProps = {
  objectKey: string
  name: string
  details: BucketObjectDetails
}

export function BucketObjectPreviewMetadata({
  objectKey,
  name,
  details,
}: BucketObjectPreviewMetadataProps) {
  return (
    <dl className='flex w-full shrink-0 flex-col gap-4 border-t border-white/10 bg-zinc-950 p-4 lg:w-80 lg:overflow-y-auto lg:border-t-0 lg:border-l'>
      <MetadataRow label='Name' value={name} />
      <MetadataRow label='Object key' value={objectKey} mono />
      <MetadataRow
        label='Content type'
        value={details.storedContentType ?? details.inferredContentType}
      />
      <MetadataRow label='Size' value={formatSize(details.size)} />
      <MetadataRow
        label='Last modified'
        value={formatLastModified(details.lastModified)}
      />
    </dl>
  )
}
