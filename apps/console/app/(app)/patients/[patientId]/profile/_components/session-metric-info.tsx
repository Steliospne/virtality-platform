'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const MetricInfo = ({
  title,
  description,
  options,
}: {
  title: string
  description: string
  options?: string
}) => {
  const [open, setOpen] = useState(false)
  const handleToggleTooltip = () => setOpen(!open)
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        aria-label={`Info: ${title}`}
        onClick={handleToggleTooltip}
      >
        <Info className='size-3.5' />
      </TooltipTrigger>
      <TooltipContent side='top' className='max-w-70 px-3 py-2 text-left'>
        <p className='font-medium'>{title}</p>
        <p className='mt-1 text-zinc-300 dark:text-zinc-600'>{description}</p>
        {options && (
          <p className='mt-1.5 border-t border-zinc-700 pt-1.5 text-zinc-400 dark:border-zinc-600 dark:text-zinc-500'>
            {options}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

export default MetricInfo
