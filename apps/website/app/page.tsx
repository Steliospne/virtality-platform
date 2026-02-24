import CallToAction from '@/components/home/call-to-action'
import Benefits from '@/components/home/benefits'
import Features from '@/components/home/features'
import Hero from '@/components/home/hero'
import PoweredBy from '@/components/home/powered-by'
import { prisma } from '@virtality/db'
import PromoVideo from '@/components/video/promo-video'

const HomePage = async () => {
  const waitlistCount = await prisma.waitingList.count()
  return (
    <div className='bg-white text-slate-900 dark:bg-zinc-900 dark:text-gray-100'>
      <Hero />
      <PromoVideo />
      <Features />
      <Benefits />
      <PoweredBy />
      {/* <Testimonials /> */}
      <CallToAction waitlistCount={waitlistCount} />
    </div>
  )
}

export default HomePage
