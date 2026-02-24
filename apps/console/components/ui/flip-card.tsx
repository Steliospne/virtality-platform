'use client'

import { useState, MouseEvent, memo, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Info, RotateCcw } from 'lucide-react'
import { cn, getDisplayName } from '@/lib/utils'
import { Separator } from './separator'
import { P } from './typography'
import { Exercise } from '@virtality/db'

interface FlipCardProps {
  exercise: Exercise
  className?: string
  isSelected: boolean
  onSelect: (e: MouseEvent) => void
}

const FlipCard = ({
  exercise,
  className,
  isSelected,
  onSelect,
}: FlipCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleFlip = (e: MouseEvent) => {
    e.stopPropagation()
    setIsFlipped(!isFlipped)
  }

  const videoRef = useRef<HTMLVideoElement | null>(null)

  const handleMouseEnter = () => {
    if (videoRef.current?.readyState === 0) return
    videoRef.current?.play()
    setIsHovered(true)
  }
  const handleMouseLeave = () => {
    if (videoRef.current?.readyState === 0) return

    videoRef.current?.pause()
    setIsHovered(false)
  }

  return (
    <div
      id={exercise.id}
      onClick={onSelect}
      className={cn(
        'perspective-1000 relative size-[250px] hover:cursor-pointer max-lg:size-[200px]',
        className,
      )}
    >
      <div
        className={cn(
          'preserve-3d relative size-full transition-transform duration-500 ease-in-out',
          isFlipped && 'rotate-y-180',
        )}
      >
        {/* Front of card */}
        <Card
          className={cn(
            'absolute inset-0 flex flex-col gap-0 overflow-hidden rounded-lg p-0 backface-hidden',
            isSelected && 'border-2 border-cyan-500 dark:border-cyan-600',
          )}
        >
          <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className='relative flex w-full flex-1 items-center overflow-hidden'
          >
            {/* <Image
              src={exercise.image || '/placeholder.svg'}
              alt={getDisplayName(exercise) + ' image'}
              fill
              className='absolute object-cover'
            /> */}
            <video
              muted
              loop
              poster={exercise.image ? undefined : '/placeholder.svg'}
              ref={videoRef}
              src={exercise.image || '/placeholder.svg'}
              className='absolute'
            />
          </div>
          <CardFooter className='justify-center p-2 text-center'>
            <P className='text-sm'>{getDisplayName(exercise)}</P>
          </CardFooter>
        </Card>

        {/* Back of card */}
        <Card
          className={cn(
            'absolute inset-0 rotate-y-180 gap-0 overflow-hidden rounded-lg p-0 backface-hidden',
            isSelected &&
              'border-vital-blue-700 dark:border-vital-blue-800 border-2',
          )}
        >
          <CardHeader className='p-2 text-center'>
            <P>{getDisplayName(exercise)}</P>
          </CardHeader>
          <Separator />
          <CardContent className='flex-1 overflow-auto p-2'>
            <P className='text-muted-foreground text-sm'>
              {exercise.description}
            </P>
          </CardContent>
          <CardFooter className='justify-end p-2'>
            <Button variant='outline' onClick={handleFlip} type='button'>
              <RotateCcw className='mr-2 size-4 transition-transform group-hover:rotate-90' />
              Flip Back
            </Button>
          </CardFooter>
        </Card>
      </div>
      {!isFlipped && (
        <Button
          size='icon-sm'
          variant='ghost'
          onClick={handleFlip}
          className='absolute top-2 right-2'
        >
          <Info />
        </Button>
      )}
    </div>
  )
}

export default FlipCard
