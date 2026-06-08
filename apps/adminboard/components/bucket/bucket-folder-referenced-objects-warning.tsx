'use client'

import { type BucketFolderPreviewOutcome } from '@virtality/shared/utils'

type BucketFolderReferencedObjectsWarningProps = {
  referencedObjects: BucketFolderPreviewOutcome['referencedObjects']
  operation: 'delete' | 'move' | 'rename'
}

function formatReferenceLabel(
  reference: BucketFolderPreviewOutcome['referencedObjects'][number]['references'][number],
): string {
  const resourceLabel =
    reference.resourceType.charAt(0).toUpperCase() +
    reference.resourceType.slice(1)

  return `${resourceLabel} ${reference.resourceLabel} (${reference.field})`
}

function getOperationMessage(
  operation: BucketFolderReferencedObjectsWarningProps['operation'],
): string {
  switch (operation) {
    case 'delete':
      return 'Deleting this folder may break the resources listed below.'
    case 'move':
    case 'rename':
      return 'Moving or renaming this folder changes CDN URLs and object keys for every object inside. Known references will not be updated automatically.'
  }
}

export function BucketFolderReferencedObjectsWarning({
  referencedObjects,
  operation,
}: BucketFolderReferencedObjectsWarningProps) {
  if (referencedObjects.length === 0) {
    return null
  }

  return (
    <div className='flex flex-col gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100'>
      <div className='flex flex-col gap-1'>
        <p className='text-sm font-medium'>Known references detected</p>
        <p className='text-sm'>
          These are known database references, not an exhaustive list of every
          external use. This folder operation will not update or remove those
          records automatically.
        </p>
        <p className='text-sm'>{getOperationMessage(operation)}</p>
        <p className='text-sm'>
          {referencedObjects.length} bucket object
          {referencedObjects.length === 1 ? '' : 's'} in this folder have known
          references.
        </p>
      </div>

      <ul className='list-disc pl-5 text-sm'>
        {referencedObjects.map((referencedObject) => (
          <li key={referencedObject.objectKey}>
            <span className='font-mono text-xs'>{referencedObject.objectKey}</span>
            <ul className='list-disc pl-5'>
              {referencedObject.references.map((reference) => (
                <li
                  key={`${reference.resourceType}-${reference.resourceId}-${reference.field}`}
                >
                  {formatReferenceLabel(reference)}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}
