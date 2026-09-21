'use client'

import { useEmailAudiences } from '@virtality/react-query'
import { Card, CardContent } from '@virtality/ui/components/card'
import { useState } from 'react'
import { EmailAudienceEditor } from './email-audience-editor'
import { EmailAudienceList } from './email-audience-list'

type Selection = { kind: 'new' } | { kind: 'audience'; id: string } | null

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

  const selected =
    selection?.kind === 'audience'
      ? (audiences ?? []).find((audience) => audience.id === selection.id)
      : undefined

  return (
    <div className='grid gap-6 lg:grid-cols-[320px_1fr]'>
      <EmailAudienceList
        audiences={audiences ?? []}
        selectedId={selection?.kind === 'audience' ? selection.id : null}
        isComposing={selection?.kind === 'new'}
        onSelect={(id) => setSelection({ kind: 'audience', id })}
        onCompose={() => setSelection({ kind: 'new' })}
      />

      <div>
        {selection === null ? (
          <Card>
            <CardContent className='flex min-h-100 items-center justify-center py-12'>
              <p className='text-muted-foreground'>
                Select an audience or create a new one.
              </p>
            </CardContent>
          </Card>
        ) : selection.kind === 'new' || selected ? (
          <EmailAudienceEditor
            key={selected?.id ?? 'new'}
            audience={selected ?? null}
            onSaved={(id) => setSelection({ kind: 'audience', id })}
            onDeleted={() => setSelection(null)}
          />
        ) : (
          <Card>
            <CardContent className='py-12'>
              <p className='text-muted-foreground text-center'>
                Audience not found.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
