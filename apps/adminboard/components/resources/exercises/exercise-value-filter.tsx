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
import { cn } from '@/lib/utils'
import { Badge } from '@virtality/ui/components/badge'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'

type ExerciseValueFilterProps = {
  label: string
  options: string[]
  selected: string[]
  onToggle: (category: string) => void
  onClear: () => void
}

/** Searchable multi-select over one exercise field's distinct values. */
export const ExerciseValueFilter = ({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: ExerciseValueFilterProps) => {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          size='sm'
          role='combobox'
          aria-expanded={open}
          className='gap-1.5'
        >
          {label}
          {selected.length > 0 ? (
            <Badge variant='secondary' className='rounded-full px-1.5'>
              {selected.length}
            </Badge>
          ) : null}
          <ChevronsUpDown className='text-muted-foreground size-3.5' />
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-64 p-0'>
        <Command>
          <CommandInput placeholder={`Search ${label.toLowerCase()}…`} />
          <CommandList>
            <CommandEmpty>No matches.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.includes(option)
                return (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => onToggle(option)}
                  >
                    <Check
                      className={cn(
                        'mr-2 size-4',
                        isSelected ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {option}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
          {selected.length > 0 ? (
            <div className='border-t p-1'>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='w-full'
                onClick={onClear}
              >
                Clear
              </Button>
            </div>
          ) : null}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
