import { BucketObjectPreviewModal } from '@/components/bucket/bucket-object-preview-modal'

type InterceptedBucketObjectPageProps = {
  params: Promise<{ objectKey: string[] }>
}

const InterceptedBucketObjectPage = async ({
  params,
}: InterceptedBucketObjectPageProps) => {
  const { objectKey } = await params

  return <BucketObjectPreviewModal objectKey={objectKey.join('/')} />
}

export default InterceptedBucketObjectPage
