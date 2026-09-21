import MosaicDashboard from '@/components/mosaic/mosaic-dashboard'

export const dynamic = 'force-dynamic'

const MosaicPage = () => {
  return (
    <div className='min-h-screen-with-header mx-auto max-w-7xl px-4 py-6'>
      <MosaicDashboard />
    </div>
  )
}

export default MosaicPage
