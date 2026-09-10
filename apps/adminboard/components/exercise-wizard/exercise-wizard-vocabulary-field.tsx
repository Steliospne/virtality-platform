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
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'

type ExerciseWizardVocabularyFieldProps = {
  label: string
  value: string
  options: string[]
  placeholder: string
  allowEmpty?: boolean
  onChange: (value: string) => void
}

export function ExerciseWizardVocabularyField({
  label,
  value,
  options,
  placeholder,
  allowEmpty = false,
  onChange,
}: ExerciseWizardVocabularyFieldProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const trimmedSearch = search.trim()
  const canAddNew =
    trimmedSearch.length > 0 &&
    !options.some(
      (option) => option.toLowerCase() === trimmedSearch.toLowerCase(),
    )

  const displayValue = useMemo(() => {
    if (!value.trim() && allowEmpty) {
      return 'None'
    }

    return value.trim() || placeholder
  }, [allowEmpty, placeholder, value])

  return (
    <div className='flex flex-col gap-2'>
      <span className='text-sm font-medium'>{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type='button'
            variant='outline'
            role='combobox'
            aria-expanded={open}
            className='w-full justify-between font-normal'
          >
            <span className='truncate'>{displayValue}</span>
            <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0'>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={`Search ${label.toLowerCase()}…`}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No matches.</CommandEmpty>
              <CommandGroup>
                {allowEmpty ? (
                  <CommandItem
                    value='__none__'
                    onSelect={() => {
                      onChange('')
                      setOpen(false)
                      setSearch('')
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 size-4',
                        !value.trim() ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    None
                  </CommandItem>
                ) : null}
                {options
                  .filter((option) =>
                    option.toLowerCase().includes(trimmedSearch.toLowerCase()),
                  )
                  .map((option) => (
                    <CommandItem
                      key={option}
                      value={option}
                      onSelect={() => {
                        onChange(option)
                        setOpen(false)
                        setSearch('')
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 size-4',
                          value === option ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {option}
                    </CommandItem>
                  ))}
                {canAddNew ? (
                  <CommandItem
                    value={`__add__${trimmedSearch}`}
                    onSelect={() => {
                      onChange(trimmedSearch)
                      setOpen(false)
                      setSearch('')
                    }}
                  >
                    <Plus className='mr-2 size-4' />
                    Add new: {trimmedSearch}
                  </CommandItem>
                ) : null}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p className='text-muted-foreground text-xs'>
        Typos create new clinician filter options. Use add new deliberately.
      </p>
    </div>
  )
}
