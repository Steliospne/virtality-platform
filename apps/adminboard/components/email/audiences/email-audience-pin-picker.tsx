'use client'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useEmailAudiencePinCandidates } from './use-email-audience-pin-candidates'
import { filterEmailAudiencePinCandidates } from '@/lib/email-audience-pin-picker'
import { Badge } from '@virtality/ui/components/badge'
import { UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'

type EmailAudiencePinPickerProps = {
  /** Current textarea contents; pinned rows are hidden from the results. */
  pinnedText: string
  onPick: (email: string) => void
  disabled?: boolean
}

/** Search registered users and Waitlist emails and pin one into a list. */
export const EmailAudiencePinPicker = ({
  pinnedText,
  onPick,
  disabled = false,
}: EmailAudiencePinPickerProps) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { candidates, isLoading } = useEmailAudiencePinCandidates(open)

  const matches = useMemo(
    () => filterEmailAudiencePinCandidates(candidates, search, pinnedText),
    [candidates, search, pinnedText],
  )

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setSearch('')
    }
  }

  return (
    <Popover modal open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          size='sm'
          role='combobox'
          disabled={disabled}
        >
          <UserPlus className='mr-2 size-4' />
          Add from users
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80 p-0' align='start' collisionPadding={8}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder='Search by name or email…'
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className='max-h-72 overscroll-contain'>
            <CommandEmpty>
              {isLoading ? 'Loading…' : 'No matching user.'}
            </CommandEmpty>
            <CommandGroup>
              {matches.map((candidate) => (
                <CommandItem
                  key={`${candidate.source}-${candidate.email}`}
                  value={candidate.email}
                  onSelect={() => {
                    onPick(candidate.email)
                    setSearch('')
                  }}
                >
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm'>
                      {candidate.name ?? candidate.email}
                    </p>
                    {candidate.name ? (
                      <p className='text-muted-foreground truncate text-xs'>
                        {candidate.email}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant='outline' className='ml-2 shrink-0'>
                    {candidate.source === 'user' ? 'User' : 'Waitlist'}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
