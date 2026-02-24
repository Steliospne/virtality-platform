'use client'

import { cn } from '@/lib/utils'
import Link, { LinkProps } from 'next/link'
import { usePathname } from 'next/navigation'
import { HTMLAttributes, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import usePatient from '@/hooks/queries/patient/use-patient'

type TabBarProps = {
  patientId?: string
  linkObject?: LinkObject
  className?: HTMLAttributes<HTMLDivElement>['className']
}

export type LinkObject = (LinkProps & {
  textContext?: string
  icon?: ReactNode
  className?: HTMLAttributes<HTMLInputElement>['className']
  featureAccess?: boolean
})[]

const TabBar = ({ patientId, linkObject }: TabBarProps) => {
  const pathname = usePathname()
  const links = linkObject ? linkObject : null

  const { data: patient } = usePatient({ patientId })

  const activeLink = pathname.split('/').pop()

  return (
    <div className='sticky top-[60px] z-30 flex h-[40px] items-center border-b bg-zinc-200/80 px-2 shadow-sm backdrop-blur-xs backdrop-saturate-180 dark:border-b-zinc-600 dark:bg-zinc-950/80'>
      {links &&
        links.map((link, i) => {
          if (!link.featureAccess) return
          return (
            <Button asChild variant='link' size={'sm'} key={i}>
              <Link
                href={link.href}
                className={cn(
                  activeLink &&
                    link.href.toString().includes(activeLink) &&
                    'bg-vital-blue-700 dark:bg-vital-blue-100 hover:bg-vital-blue-700/90 dark:hover:bg-vital-blue-100/90 text-zinc-200 dark:text-zinc-900',
                )}
              >
                <div className={cn(!link.icon && 'hidden')}>
                  {link.icon && link.icon}
                </div>
                {link.textContext}
              </Link>
            </Button>
          )
        })}
      <span className='flex-1 text-center'>
        Viewing: <span className='font-bold uppercase'>{patient?.name}</span>
      </span>
    </div>
  )
}

export default TabBar
