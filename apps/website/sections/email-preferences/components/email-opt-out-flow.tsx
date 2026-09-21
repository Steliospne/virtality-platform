'use client'

import { Button } from '@virtality/ui/components/button'
import {
  useConfirmEmailOptOut,
  useEmailOptOutLink,
} from '@virtality/react-query'
import { getEmailOptOutScopeLabel } from '@virtality/shared/utils'
import { useState } from 'react'
import { EMAIL_PREFERENCES_CONTENT } from '../content'
import { EmailPreferencesCard } from './email-preferences-card'

type EmailOptOutFlowProps = {
  token: string | null
}

/** Verifies the footer token, then records the opt-out on confirmation. */
export const EmailOptOutFlow = ({ token }: EmailOptOutFlowProps) => {
  const { data: link, isLoading, isError } = useEmailOptOutLink(token)
  const confirmMutation = useConfirmEmailOptOut()
  const [done, setDone] = useState<{ scopeLabel: string } | null>(null)

  if (!token || isError) {
    return (
      <EmailPreferencesCard title={EMAIL_PREFERENCES_CONTENT.invalidTitle}>
        <p className='text-slate-600'>
          {EMAIL_PREFERENCES_CONTENT.invalidBody}
        </p>
      </EmailPreferencesCard>
    )
  }

  if (isLoading || !link) {
    return (
      <EmailPreferencesCard title='One moment'>
        <p className='text-slate-600'>Checking your link...</p>
      </EmailPreferencesCard>
    )
  }

  if (done || link.alreadyOptedOut) {
    return (
      <EmailPreferencesCard
        title={
          done
            ? EMAIL_PREFERENCES_CONTENT.doneTitle
            : EMAIL_PREFERENCES_CONTENT.alreadyTitle
        }
      >
        <p className='text-slate-600'>
          <span className='font-medium text-slate-800'>{link.maskedEmail}</span>{' '}
          will no longer receive{' '}
          <span className='font-medium text-slate-800'>
            {(
              done?.scopeLabel ?? getEmailOptOutScopeLabel(link.scope)
            ).toLowerCase()}
          </span>
          .
        </p>
        <p className='text-slate-600'>{EMAIL_PREFERENCES_CONTENT.doneBody}</p>
      </EmailPreferencesCard>
    )
  }

  const scopeLabel = getEmailOptOutScopeLabel(link.scope)

  const confirm = async (scope: 'link' | 'all') => {
    const result = await confirmMutation.mutateAsync({
      token,
      scope: scope === 'all' ? 'all' : undefined,
    })
    setDone({ scopeLabel: getEmailOptOutScopeLabel(result.scope) })
  }

  return (
    <EmailPreferencesCard title={`Stop ${scopeLabel.toLowerCase()}?`}>
      <p className='text-slate-600'>
        <span className='font-medium text-slate-800'>{link.maskedEmail}</span>{' '}
        will stop receiving{' '}
        <span className='font-medium text-slate-800'>
          {scopeLabel.toLowerCase()}
        </span>{' '}
        from Virtality.
      </p>
      <div className='flex flex-col gap-2 pt-2 sm:flex-row'>
        <Button
          onClick={() => void confirm('link')}
          disabled={confirmMutation.isPending}
        >
          {confirmMutation.isPending
            ? 'Saving...'
            : `Stop ${scopeLabel.toLowerCase()}`}
        </Button>
        {link.scope !== 'all' ? (
          <Button
            variant='outline'
            onClick={() => void confirm('all')}
            disabled={confirmMutation.isPending}
          >
            Stop all admin emails
          </Button>
        ) : null}
      </div>
      {confirmMutation.isError ? (
        <p className='text-sm text-red-600'>
          Something went wrong. Please try again.
        </p>
      ) : null}
    </EmailPreferencesCard>
  )
}
