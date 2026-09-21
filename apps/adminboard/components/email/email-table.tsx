'use client'

import { Button } from '@/components/ui/button'
import {
  buildEmailListItems,
  filterEmailListItems,
  getEmailListSubject,
  type EmailListFilter,
} from '@/lib/email-list-items'
import { cn } from '@/lib/utils'
import { getAdminEmailTopicLabel } from '@virtality/shared/utils'
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
import { Plus, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { EmailLayoutProps } from './email-selection'
import { EmailStatusBadge } from './email-status-badge'

const FILTERS: { id: EmailListFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'sent', label: 'Sent' },
  { id: 'archived', label: 'Archived' },
]

/** One filterable table of drafts, archived drafts and sent records. */
export const EmailTable = ({
  drafts,
  archivedDrafts,
  sentRecords,
  selection,
  onSelect,
  onCreateDraft,
  isCreatingDraft,
  onRestoreDraft,
  isRestoringDraft,
}: EmailLayoutProps) => {
  const [filter, setFilter] = useState<EmailListFilter>('all')
  const [query, setQuery] = useState('')
  const items = useMemo(
    () => buildEmailListItems({ drafts, archivedDrafts, sentRecords }),
    [drafts, archivedDrafts, sentRecords],
  )
  const visible = filterEmailListItems(items, filter, query)

  const counts: Record<EmailListFilter, number> = {
    all: items.length,
    drafts: filterEmailListItems(items, 'drafts', '').length,
    sent: sentRecords.length,
    archived: archivedDrafts.length,
  }

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex flex-wrap items-center gap-1'>
          {FILTERS.map((option) => (
            <Button
              key={option.id}
              type='button'
              size='sm'
              variant={filter === option.id ? 'secondary' : 'ghost'}
              onClick={() => setFilter(option.id)}
            >
              {option.label}
              <span className='text-muted-foreground ml-1.5 font-mono text-xs tabular-nums'>
                {counts[option.id]}
              </span>
            </Button>
          ))}
        </div>
        <div className='flex items-center gap-2'>
          <Input
            className='w-56'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Search subject or audience…'
          />
          <Button
            type='button'
            onClick={onCreateDraft}
            disabled={isCreatingDraft}
          >
            <Plus className='mr-2 size-4' />
            New draft
          </Button>
        </div>
      </div>

      <div className='overflow-x-auto rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead className='text-right'>Recipients</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className='w-10' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className='text-muted-foreground py-10 text-center'
                >
                  No emails match.
                </TableCell>
              </TableRow>
            ) : null}
            {visible.map((item) => (
              <TableRow
                key={`${item.kind}:${item.id}`}
                className={cn(
                  'cursor-pointer',
                  selection?.kind === item.kind &&
                    selection.id === item.id &&
                    'bg-accent',
                )}
                onClick={() => onSelect({ kind: item.kind, id: item.id })}
              >
                <TableCell
                  className={cn(
                    'max-w-80 truncate font-medium',
                    !item.subject.trim() && 'text-muted-foreground font-normal',
                  )}
                >
                  {getEmailListSubject(item)}
                </TableCell>
                <TableCell>
                  <EmailStatusBadge status={item.status} />
                </TableCell>
                <TableCell>{getAdminEmailTopicLabel(item.topic)}</TableCell>
                <TableCell className='text-muted-foreground'>
                  {item.audienceName ?? '—'}
                </TableCell>
                <TableCell className='text-right font-mono text-sm tabular-nums'>
                  {item.recipientCount}
                  {item.failedCount > 0 ? (
                    <span className='text-destructive'>
                      {' '}
                      · {item.failedCount} failed
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className='text-muted-foreground whitespace-nowrap'>
                  {format(new Date(item.at), 'MMM d, HH:mm')}
                </TableCell>
                <TableCell>
                  {item.status === 'archived' ? (
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='size-7'
                      title='Restore draft'
                      disabled={isRestoringDraft}
                      onClick={(event) => {
                        event.stopPropagation()
                        onRestoreDraft(item.id)
                      }}
                    >
                      <RotateCcw className='size-3.5' />
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
