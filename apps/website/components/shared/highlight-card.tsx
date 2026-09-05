'use client'

import { resolveLucideIconFromModule } from '@virtality/shared/utils'
import { ChevronDown } from 'lucide-react'
import { type ComponentType, type ReactNode, useEffect, useState } from 'react'

type HighlightCardProps = {
  title: string
  body: string
  iconName?: string
  index?: number
}

const HighlightCard = ({
  title,
  body,
  iconName,
  index,
}: HighlightCardProps) => {
  const [icon, setIcon] = useState<ReactNode | null>(null)

  useEffect(() => {
    if (!iconName) {
      setIcon(null)
      return
    }

    let cancelled = false

    import('lucide-react').then((mod) => {
      if (cancelled) {
        return
      }

      const IconComponent = resolveLucideIconFromModule(
        iconName,
        mod,
      ) as ComponentType | null

      setIcon(IconComponent ? <IconComponent /> : null)
    })

    return () => {
      cancelled = true
    }
  }, [iconName])

  return (
    <>
      <details className='group border-vital-blue-100/70 rounded-xl border bg-white/90 shadow-sm sm:hidden dark:border-zinc-700 dark:bg-zinc-800'>
        <summary className='flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden'>
          <div className='from-vital-blue-700 to-vital-blue-600 shadow-vital-blue-700/15 flex size-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br shadow-md'>
            <div className='text-white *:size-5'>{icon}</div>
          </div>

          <h3 className='min-w-0 flex-1 text-base leading-snug font-bold text-slate-900 dark:text-white'>
            {title}
          </h3>

          <ChevronDown className='text-vital-blue-700 size-5 shrink-0 transition-transform duration-200 group-open:rotate-180' />
        </summary>

        <p className='px-4 pb-4 pl-[4.25rem] text-sm leading-6 text-slate-600 dark:text-gray-300'>
          {body}
        </p>
      </details>

      <div
        className='group border-vital-blue-100/50 hover:border-vital-blue-300 hover:shadow-vital-blue-700/5 dark:hover:border-vital-blue-700 relative hidden rounded-2xl border-2 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl sm:block dark:border-zinc-700 dark:bg-zinc-800'
        style={{
          animation: `fadeInUp 0.6s ease-out ${(index ?? 0) * 0.1}s both`,
        }}
      >
        <div className='from-vital-blue-600/5 absolute top-0 right-0 h-20 w-20 rounded-bl-full bg-linear-to-br to-transparent opacity-0 transition-opacity group-hover:opacity-100'></div>

        <div className='flex h-full flex-col'>
          <div className='from-vital-blue-700 to-vital-blue-600 shadow-vital-blue-700/20 mb-5 flex size-14 items-center justify-center rounded-xl bg-linear-to-br shadow-lg transition-transform duration-300 group-hover:scale-110'>
            <div className='text-white *:size-6'>{icon}</div>
          </div>

          <h3 className='group-hover:text-vital-blue-700 mb-4 text-xl font-bold text-slate-900 transition-colors dark:text-white'>
            {title}
          </h3>

          <p className='flex-1 leading-relaxed text-slate-600 dark:text-gray-300'>
            {body}
          </p>

          <div className='border-vital-blue-100 mt-6 border-t pt-4 dark:border-zinc-700'>
            <div className='from-vital-blue-700 to-vital-blue-600 h-1 w-0 rounded-full bg-linear-to-r transition-all duration-500 group-hover:w-full'></div>
          </div>
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
    </>
  )
}

export default HighlightCard
