import Image from 'next/image'
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipArrow,
} from '@/components/ui/tooltip'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Info, Pause, Play } from 'lucide-react'
import { getDisplayName } from '@/lib/utils'
import { MouseEvent, useRef, useState } from 'react'
import { Exercise } from '@virtality/db'
import { Button } from './button'

interface ExerciseDescriptionCardProps {
  exercise: Exercise
}

const ExerciseDescriptionCard = ({
  exercise,
}: ExerciseDescriptionCardProps) => {
  const [open, setOpen] = useState(false)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const handleToggleTooltip = () => setOpen(!open)

  const handlePreviewToggle = (e: MouseEvent) => {
    e.stopPropagation()
    if (!exercise.video) return
    setIsPreviewPlaying((prev) => !prev)
  }

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
              <div className='relative flex w-full flex-1 items-stretch overflow-hidden'>
                {!isPreviewPlaying ? (
                  <Image
                    src={exercise.image ?? '/placeholder.svg'}
                    alt={getDisplayName(exercise) + ' image'}
                    width={260}
                    height={260}
                    className='w-full object-contain'
                    sizes='(max-width: 640px) 90vw, (max-width: 1024px) 220px, 260px'
                  />
                ) : (
                  <video
                    ref={videoRef}
                    muted
                    loop
                    autoPlay
                    playsInline
                    src={exercise.video ?? ''}
                    poster={exercise.image || '/placeholder.svg'}
                    className='pointer-events-none size-full object-contain'
                  />
                )}

                <Button
                  type='button'
                  onClick={handlePreviewToggle}
                  aria-label={
                    isPreviewPlaying
                      ? 'Pause preview video'
                      : 'Play preview video'
                  }
                  className='absolute top-2 right-2 z-10 rounded-full bg-black/65 p-2 text-white shadow-md transition hover:scale-105 hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none'
                >
                  {isPreviewPlaying ? (
                    <Pause className='size-4 fill-current' />
                  ) : (
                    <Play className='size-4 fill-current' />
                  )}
                </Button>
              </div>
              <div className='flex-1'>
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
