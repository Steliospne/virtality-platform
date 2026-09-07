'use client'

import dynamic from 'next/dynamic'

const TrialWelcomeConfettiCanvas = dynamic(
  () =>
    import('./trial-welcome-confetti-canvas').then(
      (module) => module.TrialWelcomeConfettiCanvas,
    ),
  { ssr: false },
)

export function TrialWelcomeConfettiLazy() {
  return (
    <div aria-hidden className='pointer-events-none absolute inset-0 -z-10'>
      <TrialWelcomeConfettiCanvas />
    </div>
  )
}
