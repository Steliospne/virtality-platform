'use client'

import { Button } from '@/components/ui/button'
import { useEmailAudiences } from '@virtality/react-query'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { EmailEmptyState } from '../email-empty-state'
import { EmailAudienceEditor } from './email-audience-editor'
import { EmailAudienceTable } from './email-audience-table'

type Selection = { kind: 'new' } | { kind: 'audience'; id: string } | null

/** Table of audiences; a row (or New audience) opens the editor full-width. */
export const EmailAudiencesPanel = () => {
  const [selection, setSelection] = useState<Selection>(null)
  const { data: audiences, isLoading } = useEmailAudiences()

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <p className='text-muted-foreground'>Loading audiences...</p>
      </div>
    )
  }

  if (selection === null) {
    return (
      <EmailAudienceTable
        audiences={audiences ?? []}
        onSelect={(id) => setSelection({ kind: 'audience', id })}
        onCompose={() => setSelection({ kind: 'new' })}
      />
    )
  }

  const selected =
    selection.kind === 'audience'
      ? (audiences ?? []).find((audience) => audience.id === selection.id)
      : undefined

  return (
    <div className='space-y-4'>
      <Button
        type='button'
        variant='ghost'
        size='sm'
        onClick={() => setSelection(null)}
      >
        <ArrowLeft className='mr-1.5 size-4' />
        Audiences
      </Button>
      {selection.kind === 'new' || selected ? (
        <EmailAudienceEditor
          key={selected?.id ?? 'new'}
          audience={selected ?? null}
          onSaved={(id) => setSelection({ kind: 'audience', id })}
          onDeleted={() => setSelection(null)}
        />
      ) : (
        <EmailEmptyState message='Audience not found.' />
      )}
    </div>
  )
}
