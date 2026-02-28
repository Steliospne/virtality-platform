import { Fraunces } from 'next/font/google'
import { ShieldX } from 'lucide-react'
import { BackToConsoleButton, BackToWebsiteButton } from './no-access-cta'

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
})

export default function NoAccessPage() {
  return (
    <div className='no-access-page bg-background relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 py-16'>
      {/* Background: gradient + subtle grid */}
      <div
        className='pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06]'
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
        aria-hidden
      />
      <div
        className='to-background dark:to-background pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-transparent opacity-80 dark:from-zinc-950/50 dark:via-transparent'
        aria-hidden
      />

      <div className='no-access-content relative z-10 flex max-w-md flex-col items-center text-center'>
        {/* Icon */}
        <div
          className='no-access-item border-border bg-card mb-6 flex size-16 items-center justify-center rounded-2xl border shadow-sm dark:border-zinc-700/50'
          style={{ animationDelay: '0ms' }}
        >
          <ShieldX className='text-muted-foreground size-8' />
        </div>

        {/* Headline */}
        <h1
          className={`no-access-item ${fraunces.className} text-foreground text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl`}
          style={{ animationDelay: '80ms' }}
        >
          Access restricted
        </h1>

        {/* Supporting text */}
        <p
          className='no-access-item text-muted-foreground mt-4 text-base leading-relaxed sm:text-lg'
          style={{ animationDelay: '160ms' }}
        >
          This area is for administrators only. If you believe you should have
          access, please contact your system administrator.
        </p>

        <div
          className='no-access-item space-x-4'
          style={{ animationDelay: '280ms' }}
        >
          <BackToWebsiteButton />
          <BackToConsoleButton />
        </div>
      </div>
    </div>
  )
}
