'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getErrorMessage } from '@/lib/get-error-message'
import { usePreviewEmailAudienceMembers } from '@virtality/react-query'
import { Input } from '@virtality/ui/components/input'
import { Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

type EmailAudienceMembersDialogProps = {
  input: Parameters<
    ReturnType<typeof usePreviewEmailAudienceMembers>['mutateAsync']
  >[0]
  total: number
}

/** Every member the form resolves to right now, with names where known. */
export const EmailAudienceMembersDialog = ({
  input,
  total,
}: EmailAudienceMembersDialogProps) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const membersMutation = usePreviewEmailAudienceMembers()

  const handleOpen = async () => {
    setOpen(true)
    setQuery('')
    try {
      await membersMutation.mutateAsync(input)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to list members'))
      setOpen(false)
    }
  }

  const needle = query.trim().toLowerCase()
  const members = (membersMutation.data?.members ?? []).filter(
    (member) =>
      needle === '' ||
      member.email.toLowerCase().includes(needle) ||
      (member.name ?? '').toLowerCase().includes(needle),
  )

  return (
    <>
      <Button type='button' variant='ghost' onClick={() => void handleOpen()}>
        <Users className='mr-2 size-4' />
        View members
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='flex max-h-[85vh] flex-col sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>
              {membersMutation.data?.total ?? total} member
              {(membersMutation.data?.total ?? total) === 1 ? '' : 's'}
            </DialogTitle>
            <DialogDescription>
              Resolved from the form as it is now. Waitlist and pinned emails
              have no Console name.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Filter by name or email…'
          />
          <div className='min-h-0 flex-1 overflow-y-auto rounded-lg border'>
            {membersMutation.isPending ? (
              <p className='text-muted-foreground p-4 text-sm'>Loading…</p>
            ) : members.length === 0 ? (
              <p className='text-muted-foreground p-4 text-sm'>
                No members match.
              </p>
            ) : (
              <ul className='divide-y'>
                {members.map((member) => (
                  <li
                    key={member.email}
                    className='flex flex-col gap-0.5 px-3 py-2 text-sm'
                  >
                    <span className='font-medium'>
                      {member.name ?? (
                        <span className='text-muted-foreground font-normal'>
                          No account
                        </span>
                      )}
                    </span>
                    <span className='text-muted-foreground text-xs'>
                      {member.email}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
