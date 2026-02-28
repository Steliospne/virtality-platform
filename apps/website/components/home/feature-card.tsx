'use client'
import { FC, ReactNode, useEffect, useState } from 'react'

const FeatureCard = ({
  title,
  ctx,
  icon,
  index,
}: {
  title: string
  ctx: string
  icon?: keyof typeof import('lucide-react')
  index?: number
}) => {
  const [importedComponent, setImportedComponent] = useState<ReactNode | null>(
    null,
  )
  useEffect(() => {
    if (!icon) return

    const importComponent = async () => {
      import(`lucide-react`).then((mod) => {
        if (mod) {
          const IconComponent = mod[icon] as FC
          setImportedComponent(<IconComponent />)
        }
      })
    }

    importComponent()
  }, [icon])

  return (
    <div
      className='group relative rounded-2xl border-2 border-vital-blue-100/50 bg-white p-8 shadow-sm hover:shadow-xl hover:shadow-vital-blue-700/5 transition-all duration-300 dark:border-zinc-700 dark:bg-zinc-800 hover:border-vital-blue-300 dark:hover:border-vital-blue-700'
      style={{
        animation: `fadeInUp 0.6s ease-out ${(index || 0) * 0.1}s both`,
      }}
    >
      {/* Decorative corner accent */}
      <div className='absolute top-0 right-0 w-20 h-20 bg-linear-to-br from-vital-blue-600/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity'></div>

      <div className='flex flex-col h-full'>
        <div className='mb-5 flex size-14 items-center justify-center rounded-xl bg-linear-to-br from-vital-blue-700 to-vital-blue-600 shadow-lg shadow-vital-blue-700/20 group-hover:scale-110 transition-transform duration-300'>
          <div className='*:size-6 text-white'>{importedComponent}</div>
        </div>

        <h3 className='mb-4 text-xl font-bold text-slate-900 dark:text-white group-hover:text-vital-blue-700 transition-colors'>
          {title}
        </h3>

        <p className='text-slate-600 dark:text-gray-300 leading-relaxed flex-1'>
          {ctx}
        </p>

        {/* Bottom accent line */}
        <div className='mt-6 pt-4 border-t border-vital-blue-100 dark:border-zinc-700'>
          <div className='h-1 w-0 bg-linear-to-r from-vital-blue-700 to-vital-blue-600 rounded-full group-hover:w-full transition-all duration-500'></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default FeatureCard
