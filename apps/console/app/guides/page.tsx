'use client'
import { guides } from '@/data/static/guides'
import GuideCard from './guide-card'
import usePageViewTracking from '@/hooks/analytics/use-page-view-tracking'

const GuidesPage = () => {
  usePageViewTracking({
    props: { route_group: 'user' },
  })
  return (
    <div className='container m-auto space-y-4 p-4'>
      {guides.map((item, index) => (
        <GuideCard key={index} item={item} />
      ))}
    </div>
  )
}

export default GuidesPage
