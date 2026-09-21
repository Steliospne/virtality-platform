import { Badge } from '@virtality/ui/components/badge'
import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Pill-shaped toggle filter. Controlled when `checked` is provided,
 * otherwise it keeps its own state.
 */
const FilterBadge = ({
  name,
  checked: checkedProp,
  onClick,
}: {
  name: string
  checked?: boolean
  onClick?: () => void
}) => {
  const [internalChecked, setInternalChecked] = useState(false)
  const checked = checkedProp ?? internalChecked

  const handleClick = () => {
    onClick?.()
    if (checkedProp === undefined) {
      setInternalChecked((current) => !current)
    }
  }

  return (
    <div>
      <Badge
        variant={checked ? 'default' : 'outline'}
        aria-pressed={checked}
        className={cn(
          'cursor-pointer rounded-full px-2 py-1 select-none',
          checked
            ? 'ring-primary/40 ring-2 ring-offset-1'
            : 'hover:bg-accent hover:text-accent-foreground',
        )}
        onClick={handleClick}
      >
        {name}
      </Badge>
    </div>
  )
}

export default FilterBadge
