import { guides } from '@/data/static/guides'
import GuideCard from './guide-card'

const GuidesPage = async () => {
  return (
    <div className='container m-auto space-y-4 p-4'>
      {guides.map((item, index) => (
        <GuideCard key={index} item={item} />
      ))}
    </div>
  )
}

export default GuidesPage
