import Image from 'next/image'

const PoweredBy = () => {
  return (
    <section className='relative py-16 overflow-hidden bg-linear-to-b from-white via-slate-50 to-white dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900'>
      {/* Subtle background pattern */}
      <div
        className='absolute inset-0 opacity-[0.015]'
        style={{
          backgroundImage: `
            radial-gradient(circle at 2px 2px, #08899a 1px, transparent 0)
          `,
          backgroundSize: '40px 40px',
        }}
      ></div>

      <div className='container relative z-10 m-auto px-4 md:px-8'>
        <div className='max-w-5xl mx-auto'>
          {/* Section header */}
          <div className='text-center mb-12'>
            <div className='inline-flex items-center gap-2 rounded-full bg-vital-blue-700/10 px-4 py-2 text-sm font-semibold text-vital-blue-700 mb-4'>
              <span>Strategic Partnership</span>
            </div>
            <h2 className='text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3'>
              Supported By
            </h2>
            <p className='text-slate-600 dark:text-gray-300 max-w-2xl mx-auto'>
              Our innovation is backed by leading institutions committed to
              advancing healthcare technology
            </p>
          </div>

          {/* Logo container */}
          <div className='relative'>
            {/* Decorative elements */}
            <div className='absolute -inset-4 bg-linear-to-r from-vital-blue-600/10 to-vital-blue-400/10 rounded-2xl blur-xl'></div>

            <div className='relative bg-white dark:bg-zinc-800 rounded-2xl border-2 border-vital-blue-100/50 dark:border-zinc-700 shadow-lg p-12 md:p-16'>
              <div className='flex items-center justify-center'>
                <div className='relative max-w-md w-full group'>
                  {/* Logo wrapper with hover effect */}
                  <div className='transition-transform group-hover:scale-105 duration-300'>
                    <Image
                      src='/Peiraios_logo.svg'
                      alt='Peiraios logo'
                      width={853}
                      height={150}
                      className='w-full h-auto dark:invert dark:brightness-0 dark:contrast-200'
                      priority
                    />
                  </div>
                </div>
              </div>

              {/* Additional info */}
              <div className='mt-8 pt-8 border-t border-vital-blue-100 dark:border-zinc-700'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6 text-center'>
                  <div>
                    <div className='text-sm font-semibold text-vital-blue-700 mb-1'>
                      Innovation Partner
                    </div>
                    <div className='text-xs text-slate-500 dark:text-gray-400'>
                      Healthcare Technology
                    </div>
                  </div>
                  <div>
                    <div className='text-sm font-semibold text-vital-blue-700 mb-1'>
                      Research Support
                    </div>
                    <div className='text-xs text-slate-500 dark:text-gray-400'>
                      Clinical Development
                    </div>
                  </div>
                  <div>
                    <div className='text-sm font-semibold text-vital-blue-700 mb-1'>
                      Strategic Guidance
                    </div>
                    <div className='text-xs text-slate-500 dark:text-gray-400'>
                      Market Advancement
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PoweredBy
