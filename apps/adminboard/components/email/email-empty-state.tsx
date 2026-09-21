'use client'

import { Card, CardContent } from '@virtality/ui/components/card'

type EmailEmptyStateProps = {
  message: string
  action?: React.ReactNode
}

export const EmailEmptyState = ({ message, action }: EmailEmptyStateProps) => (
  <Card>
    <CardContent className='flex min-h-100 flex-col items-center justify-center gap-4 py-12'>
      <p className='text-muted-foreground'>{message}</p>
      {action}
    </CardContent>
  </Card>
)
