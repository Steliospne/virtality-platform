import PromoVideoDashboard from '@/components/promo-video/promo-video-dashboard'

export const dynamic = 'force-dynamic'

const PromoVideoPage = () => {
  return (
    <div className='min-h-screen-with-header mx-auto max-w-7xl px-4 py-6'>
      <PromoVideoDashboard />
    </div>
  )
}

export default PromoVideoPage
