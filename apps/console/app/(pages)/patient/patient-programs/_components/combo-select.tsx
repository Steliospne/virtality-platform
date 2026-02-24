import { CheckIcon, ChevronsUpDownIcon, X } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { MouseEvent, useState } from 'react'
import { cn } from '@/lib/utils'

const ComboSelect = ({
  value,
  term,
  onChange,
  options,
}: {
  value: string
  term: string
  onChange: (value: string) => void
  options: string[]
}) => {
  const [open, setOpen] = useState(false)

  const selectValue = (currentValue: string) => {
    onChange(currentValue === value ? '' : currentValue)
    setOpen(false)
  }

  const clearSearch = (e: MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className='relative'>
        <div>
          <Button
            type='button'
            variant='outline'
            role='combobox'
            // aria-expanded={open}
            className='w-full justify-between'
          >
            {value ? (
              options.find((option) => option === value)
            ) : (
              <span className='text-muted-foreground'>Select {term}...</span>
            )}
            <ChevronsUpDownIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
          {value && (
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='absolute top-1.5 right-8 size-6'
              onClick={clearSearch}
            >
              <X />
            </Button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className='w-(--radix-popover-trigger-width) p-0'>
        <Command>
          <CommandInput placeholder={`Search ${term}...`} />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem key={option} value={option} onSelect={selectValue}>
                  <CheckIcon
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === option ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default ComboSelect
