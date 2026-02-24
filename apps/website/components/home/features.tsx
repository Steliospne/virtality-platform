import { features } from '@/data/features'
import FeatureCard from '@/components/home/feature-card'

const Features = () => {
  return (
    <section
      id='features'
      className='relative dark:bg-zinc-900 flex py-24 overflow-hidden'
    >
      {/* Background with medical motif */}
      <div className='absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-vital-blue-50/20'></div>
      <div
        className='absolute inset-0 opacity-[0.02]'
        style={{
          backgroundImage: `
            radial-gradient(circle at 2px 2px, #08899a 1px, transparent 0)
          `,
          backgroundSize: '48px 48px',
        }}
      ></div>

      <div className='container relative z-10 m-auto px-4 md:px-8 py-16'>
        <div className='mx-auto mb-16 max-w-3xl text-center'>
          <div className='inline-flex items-center gap-2 rounded-full bg-vital-blue-700/10 px-4 py-2 text-sm font-semibold text-vital-blue-700 mb-6'>
            <span>Platform Capabilities</span>
          </div>
          <h2 className='mb-6 text-4xl font-bold md:text-5xl text-slate-900 dark:text-white'>
            Clinical Features for{' '}
            <span className='bg-gradient-to-r from-vital-blue-700 to-vital-blue-600 bg-clip-text text-transparent'>
              Modern Healthcare
            </span>
          </h2>
          <p className='text-lg leading-relaxed text-slate-600 dark:text-gray-300'>
            Advanced VR platform equipped with comprehensive tools to enhance
            rehabilitation therapy, accelerate patient recovery, and deliver
            measurable clinical outcomes.
          </p>
        </div>

        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto'>
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              ctx={feature.context}
              icon={feature.icon}
              index={index}
            />
          ))}
        </div>

        {/* Clinical metrics bar */}
        <div className='mt-20 max-w-5xl mx-auto'>
          <div className='bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-vital-blue-100/50 p-8'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-vital-blue-100'>
              <div className='pt-8 md:pt-0'>
                <div className='text-4xl font-bold text-vital-blue-700 mb-2 font-[var(--font-jetbrains-mono)]'>
                  50-95%
                </div>
                <div className='text-sm font-medium text-slate-600 dark:text-gray-300'>
                  Faster Recovery Rate
                </div>
                <div className='text-xs text-slate-500 mt-1'>
                  vs. traditional therapy
                </div>
              </div>
              <div className='pt-8 md:pt-0'>
                <div className='text-4xl font-bold text-vital-blue-700 mb-2 font-[var(--font-jetbrains-mono)]'>
                  95%
                </div>
                <div className='text-sm font-medium text-slate-600 dark:text-gray-300'>
                  Patient Engagement
                </div>
                <div className='text-xs text-slate-500 mt-1'>
                  sustained throughout treatment
                </div>
              </div>
              <div className='pt-8 md:pt-0'>
                <div className='text-4xl font-bold text-vital-blue-700 mb-2 font-[var(--font-jetbrains-mono)]'>
                  2.5x
                </div>
                <div className='text-sm font-medium text-slate-600 dark:text-gray-300'>
                  Increased Efficiency
                </div>
                <div className='text-xs text-slate-500 mt-1'>
                  more patients per session
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Features
