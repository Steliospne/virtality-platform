import { BucketObjectPreviewPageShell } from '@/components/bucket/bucket-object-preview-page-shell'

export const dynamic = 'force-dynamic'

type BucketObjectPageProps = {
  params: Promise<{ objectKey: string[] }>
}

const BucketObjectPage = async ({ params }: BucketObjectPageProps) => {
  const { objectKey } = await params

  return <BucketObjectPreviewPageShell objectKey={objectKey.join('/')} />
}

export default BucketObjectPage
