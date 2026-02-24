import Image from 'next/image'
import LogoName from '../logo/logo-name'
import ButtonToAction from './btn-to-action'
import HeroTitle from './hero-title'

const Hero = () => {
  return (
    <section className='min-h-screen-with-nav relative flex overflow-hidden bg-gradient-to-br from-slate-50 via-white to-vital-blue-50/30'>
      {/* Medical Grid Pattern Background */}
      <div
        className='absolute inset-0 opacity-[0.015]'
        style={{
          backgroundImage: `
               linear-gradient(to right, #08899a 1px, transparent 1px),
               linear-gradient(to bottom, #08899a 1px, transparent 1px)
             `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Animated gradient orbs */}
      <div
        className='absolute top-0 right-0 w-[500px] h-[500px] bg-vital-blue-400/10 rounded-full blur-3xl animate-pulse'
        style={{ animationDuration: '4s' }}
      />
      <div
        className='absolute bottom-0 left-0 w-[400px] h-[400px] bg-vital-blue-600/5 rounded-full blur-3xl animate-pulse'
        style={{ animationDuration: '6s', animationDelay: '1s' }}
      />

      {/* Banner */}
      <div className='absolute top-[0px] min-h-[48px] bg-gradient-to-r from-vital-blue-800 to-vital-blue-700 w-full flex items-center z-10 shadow-lg'>
        <p className='font-medium text-white text-center flex-1 text-sm tracking-wide'>
          Join our growing community of healthcare professionals by entering our{' '}
          <span>
            <ButtonToAction />
          </span>
        </p>
      </div>

      <div className='container m-auto px-4 md:px-8 max-sm:py-32 py-20 pt-24 relative z-[1]'>
        <div className='flex flex-col items-center gap-12 lg:gap-20'>
          <LogoName size={1.8} />
          <div className='grid items-center gap-16 lg:grid-cols-2 w-full max-w-7xl'>
            <HeroTitle />
            <div className='relative group'>
              {/* Decorative elements */}
              <div className='absolute -inset-4 bg-gradient-to-r from-vital-blue-600/20 to-vital-blue-400/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500'></div>
              <div className='absolute -top-6 -right-6 w-24 h-24 border-2 border-vital-blue-700/30 rounded-full'></div>
              <div className='absolute -bottom-6 -left-6 w-32 h-32 border-2 border-vital-blue-600/20 rounded-full'></div>

              <div className='relative bg-white/80 backdrop-blur-sm p-3 rounded-3xl shadow-2xl border border-vital-blue-100/50'>
                <Image
                  src='https://cdn.virtality.app/f0c18d8ef3258c8510bbf79bba1f3872241bdab6c8251c9724e4e766132a5b20'
                  alt='Doctor using VR headset with patient'
                  width={600}
                  height={600}
                  className='relative mx-auto w-full rounded-2xl'
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
