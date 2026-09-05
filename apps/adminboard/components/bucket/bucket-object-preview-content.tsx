'use client'

import { useBucketObjectDetails } from '@virtality/react-query'
import {
  getBucketObjectParentPrefix,
  getObjectDisplayName,
} from '@virtality/shared/utils'
import { Spinner } from '@virtality/ui/components/spinner'
import { BucketObjectPreviewMedia } from './bucket-object-preview-media'
import { BucketObjectPreviewMetadata } from './bucket-object-preview-metadata'
import { BucketObjectPreviewMissing } from './bucket-object-preview-missing'

export function BucketObjectPreviewContent({
  objectKey,
}: {
  objectKey: string
}) {
  const detailsQuery = useBucketObjectDetails(objectKey)

  if (detailsQuery.isLoading) {
    return (
      <div className='flex flex-1 items-center justify-center bg-black p-10'>
        <Spinner />
      </div>
    )
  }

  if (detailsQuery.error || !detailsQuery.data || !detailsQuery.data.found) {
    return <BucketObjectPreviewMissing objectKey={objectKey} />
  }

  const details = detailsQuery.data
  const name = getObjectDisplayName(
    objectKey,
    getBucketObjectParentPrefix(objectKey),
  )

  return (
    <div className='flex min-h-0 flex-1 flex-col lg:flex-row'>
      <BucketObjectPreviewMedia
        cdnUrl={details.cdnUrl}
        contentType={details.storedContentType ?? details.inferredContentType}
        name={name}
      />
      <BucketObjectPreviewMetadata
        objectKey={objectKey}
        name={name}
        details={details}
      />
    </div>
  )
}
