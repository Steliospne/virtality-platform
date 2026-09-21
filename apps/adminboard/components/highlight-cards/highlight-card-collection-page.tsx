import { HighlightCardCollectionEditor } from '@/components/highlight-cards/highlight-card-collection-editor'
import type { HighlightCardCollection } from '@virtality/shared/types'

type HighlightCardCollectionPageProps = {
  collection: HighlightCardCollection
}

export function HighlightCardCollectionPage({
  collection,
}: HighlightCardCollectionPageProps) {
  return (
    <div className='min-h-screen-with-header mx-auto max-w-7xl px-4 py-6'>
      <HighlightCardCollectionEditor collection={collection} />
    </div>
  )
}
