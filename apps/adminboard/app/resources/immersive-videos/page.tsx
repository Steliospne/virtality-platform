import { AddressablesCatalogCard } from '@/components/resources/immersive-videos/addressables-catalog-card'
import ImmersiveVideoTable from '@/components/resources/immersive-videos/immersive-video-table'

export const dynamic = 'force-dynamic'

const ImmersiveVideosPage = () => {
  return (
    <>
      <div className='px-8 pt-8'>
        <AddressablesCatalogCard />
      </div>
      <ImmersiveVideoTable />
    </>
  )
}

export default ImmersiveVideosPage
