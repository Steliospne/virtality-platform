'use client'

import { type BucketObjectReference } from '@virtality/shared/utils'

type BucketReferencedObjectWarningProps = {
  references: BucketObjectReference[]
  operation: 'delete' | 'move' | 'rename' | 'replace'
  deleteOldObject?: boolean
}

function formatReferenceLabel(reference: BucketObjectReference): string {
  const resourceLabel =
    reference.resourceType.charAt(0).toUpperCase() +
    reference.resourceType.slice(1)

  return `${resourceLabel} ${reference.resourceLabel} (${reference.field})`
}

function getOperationMessage(
  operation: BucketReferencedObjectWarningProps['operation'],
  deleteOldObject?: boolean,
): string {
  switch (operation) {
    case 'delete':
      return 'Deleting this bucket object may break the resources listed below.'
    case 'move':
    case 'rename':
      return 'Moving or renaming this bucket object changes its CDN URL and object key. Known references will not be updated automatically.'
    case 'replace':
      return deleteOldObject
        ? 'Replacing and deleting the previous object may break the resources listed below.'
        : 'Replacement uploads a new bucket object. Known references will continue pointing at the current CDN URL unless you update those resources separately.'
  }
}

export function BucketReferencedObjectWarning({
  references,
  operation,
  deleteOldObject,
}: BucketReferencedObjectWarningProps) {
  if (references.length === 0) {
    return null
  }

  return (
    <div className='flex flex-col gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100'>
      <div className='flex flex-col gap-1'>
        <p className='text-sm font-medium'>Known references detected</p>
        <p className='text-sm'>
          These are known database references, not an exhaustive list of every
          external use. This bucket operation will not update or remove those
          records automatically.
        </p>
        <p className='text-sm'>{getOperationMessage(operation, deleteOldObject)}</p>
      </div>

      <ul className='list-disc pl-5 text-sm'>
        {references.map((reference) => (
          <li key={`${reference.resourceType}-${reference.resourceId}-${reference.field}`}>
            {formatReferenceLabel(reference)}
          </li>
        ))}
      </ul>
    </div>
  )
}
