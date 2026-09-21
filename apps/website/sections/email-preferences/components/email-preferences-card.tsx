'use client'

import { Card, CardContent } from '@virtality/ui/components/card'
import type { ReactNode } from 'react'
import { EMAIL_PREFERENCES_CONTENT } from '../content'

type EmailPreferencesCardProps = {
  title: string
  children: ReactNode
}

/** Page shell shared by every state of the opt-out flow. */
export const EmailPreferencesCard = ({
  title,
  children,
}: EmailPreferencesCardProps) => (
  <section className='flex min-h-screen flex-col items-center bg-linear-to-br from-slate-50 to-teal-50 px-4 py-16'>
    <Card className='w-full max-w-lg border-0 bg-white/90 shadow-xl backdrop-blur-sm'>
      <CardContent className='space-y-4 p-8 md:p-10'>
        <p className='text-sm font-medium tracking-wide text-teal-700 uppercase'>
          {EMAIL_PREFERENCES_CONTENT.title}
        </p>
        <h1 className='text-2xl font-bold text-slate-800 md:text-3xl'>
          {title}
        </h1>
        {children}
        <p className='pt-2 text-xs text-slate-500'>
          Questions? Write to{' '}
          <a
            className='underline'
            href={`mailto:${EMAIL_PREFERENCES_CONTENT.contactEmail}`}
          >
            {EMAIL_PREFERENCES_CONTENT.contactEmail}
          </a>
          .
        </p>
      </CardContent>
    </Card>
  </section>
)
