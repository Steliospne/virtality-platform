'use client'

import { Button } from '@/components/ui/button'
import { describeEmailAudienceRule } from '@/lib/email-audience-form'
import type { EmailAudienceRule } from '@virtality/shared/types'
import { Input } from '@virtality/ui/components/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@virtality/ui/components/table'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import { useState } from 'react'

type AudienceRow = {
  id: string
  name: string
  description: string | null
  rule: EmailAudienceRule
  includeEmails: string[]
  excludeEmails: string[]
  attachedDraftCount: number
  updatedAt: string | Date
}

type EmailAudienceTableProps = {
  audiences: AudienceRow[]
  onSelect: (audienceId: string) => void
  onCompose: () => void
}

/** One searchable table of audiences; a row opens the editor. */
export const EmailAudienceTable = ({
  audiences,
  onSelect,
  onCompose,
}: EmailAudienceTableProps) => {
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const visible = audiences.filter(
    (audience) =>
      needle === '' ||
      audience.name.toLowerCase().includes(needle) ||
      (audience.description ?? '').toLowerCase().includes(needle),
  )

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <p className='text-muted-foreground text-sm'>
          Internal recipient groups. Rules are evaluated at send time.
        </p>
        <div className='flex items-center gap-2'>
          <Input
            className='w-56'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Search audiences…'
          />
          <Button type='button' onClick={onCompose}>
            <Plus className='mr-2 size-4' />
            New audience
          </Button>
        </div>
      </div>

      <div className='overflow-x-auto rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Rule</TableHead>
              <TableHead className='text-right'>Pinned</TableHead>
              <TableHead className='text-right'>Drafts</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className='text-muted-foreground py-10 text-center'
                >
                  {audiences.length === 0
                    ? 'No audiences yet.'
                    : 'No audiences match.'}
                </TableCell>
              </TableRow>
            ) : null}
            {visible.map((audience) => (
              <TableRow
                key={audience.id}
                className='cursor-pointer'
                onClick={() => onSelect(audience.id)}
              >
                <TableCell className='max-w-72'>
                  <p className='truncate font-medium'>{audience.name}</p>
                  {audience.description ? (
                    <p className='text-muted-foreground truncate text-xs'>
                      {audience.description}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className='text-muted-foreground max-w-96 truncate'>
                  {describeEmailAudienceRule(
                    audience.rule,
                    audience.includeEmails.length,
                  )}
                </TableCell>
                <TableCell className='text-right font-mono text-sm tabular-nums'>
                  +{audience.includeEmails.length} / −
                  {audience.excludeEmails.length}
                </TableCell>
                <TableCell className='text-right font-mono text-sm tabular-nums'>
                  {audience.attachedDraftCount}
                </TableCell>
                <TableCell className='text-muted-foreground whitespace-nowrap'>
                  {format(new Date(audience.updatedAt), 'MMM d, HH:mm')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
