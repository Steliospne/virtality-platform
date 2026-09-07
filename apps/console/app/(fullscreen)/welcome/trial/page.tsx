import { Suspense } from 'react'
import { TrialWelcomePage } from './_components/trial-welcome-page'

export default function WelcomeTrialRoute() {
  return (
    <Suspense>
      <TrialWelcomePage />
    </Suspense>
  )
}
