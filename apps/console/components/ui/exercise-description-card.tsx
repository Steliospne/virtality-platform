import placeholder from '@/public/placeholder.svg'
import Image from 'next/image'
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipArrow,
} from '@/components/ui/tooltip'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Info } from 'lucide-react'
import { getDisplayName } from '@/lib/utils'
import { useState } from 'react'
import { Exercise } from '@virtality/db'
import Video from './video'

interface ExerciseDescriptionCardProps {
  exercise: Exercise
}

const ExerciseDescriptionCard = ({
  exercise,
}: ExerciseDescriptionCardProps) => {
  const [open, setOpen] = useState(false)

  const handleToggleTooltip = () => setOpen(!open)

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild onClick={handleToggleTooltip}>
          <Info className='size-3.5' />
        </TooltipTrigger>
        <TooltipContent asChild align='center' side='left'>
          <Card className='max-w-(--breakpoint-sm) bg-zinc-50 p-4 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-200'>
            <CardHeader>
              <CardTitle className='text-xl'>
                {getDisplayName(exercise)}
              </CardTitle>
            </CardHeader>
            <CardContent className='flex items-center gap-4'>
              {/* <Image
                alt='Exercise image'
                width={150}
                height={150}
                loading='eager'
                src={exercise?.image ? exercise.image : placeholder}
                className='rounded-lg'
              /> */}
              <div className='relative m-auto flex w-full items-center'>
                <Video src={exercise?.image ? exercise.image : placeholder} />
              </div>
              <div>
                <h4 className='text-lg'>Description</h4>
                <p className='text-base'>{exercise.description}</p>
              </div>
            </CardContent>
            <TooltipArrow className='fill-zinc-200 dark:fill-zinc-900' />
          </Card>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default ExerciseDescriptionCard
