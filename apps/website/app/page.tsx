import CallToAction from '@/components/home/call-to-action'
import Benefits from '@/components/home/benefits'
import Features from '@/components/home/features'
import Hero from '@/components/home/hero'
import PoweredBy from '@/components/home/powered-by'
import PromoVideo from '@/components/video/promo-video'

const HomePage = () => {
  return (
    <div className='bg-white text-slate-900 dark:bg-zinc-900 dark:text-gray-100'>
      <Hero />
      <PromoVideo />
      <Features />
      <Benefits />
      <PoweredBy />
      {/* <Testimonials /> */}
      <CallToAction />
    </div>
  )
}

export default HomePage
