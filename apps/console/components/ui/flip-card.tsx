'use client'

import { useEffect, useRef, useState, MouseEvent } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Info, Pause, Play, RotateCcw } from 'lucide-react'
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
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const handleFlip = (e: MouseEvent) => {
    e.stopPropagation()
    setIsPreviewPlaying(false)
    setIsFlipped(!isFlipped)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(pointer: coarse)')
    const updateInteractionMode = () => setIsTouchDevice(mediaQuery.matches)

    updateInteractionMode()
    mediaQuery.addEventListener('change', updateInteractionMode)
    return () => mediaQuery.removeEventListener('change', updateInteractionMode)
  }, [])

  useEffect(() => {
    if (!isPreviewPlaying) {
      videoRef.current?.pause()
      return
    }
    void videoRef.current?.play().catch(() => {
      setIsPreviewPlaying(false)
    })
  }, [isPreviewPlaying])

  const handlePreviewToggle = (e: MouseEvent) => {
    e.stopPropagation()
    if (!exercise.video) return
    setIsPreviewPlaying((prev) => !prev)
  }

  return (
    <div
      id={exercise.id}
      onClick={onSelect}
      className={cn(
        'perspective-1000 relative w-full max-w-[260px] cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:max-w-[200px] md:max-w-[220px] lg:max-w-[240px] xl:max-w-[260px]',
        isSelected &&
          'scale-[1.01] drop-shadow-[0_0_16px_rgba(34,211,238,0.55)] transition-transform duration-200',
        className,
      )}
    >
      <div
        className={cn(
          'preserve-3d relative aspect-4/5 size-full transition-transform duration-500 ease-in-out',
          isFlipped && 'rotate-y-180',
        )}
      >
        <CardFront
          exercise={exercise}
          isSelected={isSelected}
          isPreviewPlaying={isPreviewPlaying}
          isTouchDevice={isTouchDevice}
          videoRef={videoRef}
          isFlipped={isFlipped}
          handleFlip={handleFlip}
          handlePreviewToggle={handlePreviewToggle}
        />

        <CardBack
          exercise={exercise}
          isSelected={isSelected}
          handleFlip={handleFlip}
        />
      </div>
    </div>
  )
}

export default FlipCard

interface CardFrontProps {
  exercise: Exercise
  isSelected: boolean
  isPreviewPlaying: boolean
  isTouchDevice: boolean
  isFlipped: boolean
  handleFlip: (e: MouseEvent) => void
  handlePreviewToggle: (e: MouseEvent) => void
  videoRef: React.RefObject<HTMLVideoElement | null>
}

function CardFront({
  exercise,
  isSelected,
  isPreviewPlaying,
  isTouchDevice,
  isFlipped,
  videoRef,
  handleFlip,
  handlePreviewToggle,
}: CardFrontProps) {
  return (
    <Card
      className={cn(
        'absolute inset-0 flex flex-col gap-0 overflow-hidden rounded-lg p-0 transition-all backface-hidden',
        isSelected &&
          'border-2 border-cyan-400 ring-2 ring-cyan-300/35 dark:border-cyan-500 dark:ring-cyan-500/35',
      )}
    >
      <div className='relative flex w-full flex-1 items-center overflow-hidden'>
        {!isPreviewPlaying ? (
          <>
            <Image
              src={exercise.image ?? '/placeholder.svg'}
              alt={getDisplayName(exercise) + ' image'}
              fill
              className='object-contain'
              sizes='(max-width: 640px) 90vw, (max-width: 1024px) 220px, 260px'
            />
            <div className='pointer-events-none absolute inset-0 flex items-end bg-linear-to-t from-black/80 via-black/30 to-transparent p-3 text-left text-white'>
              <div>
                <span className='block text-sm font-semibold sm:text-base'>
                  {isTouchDevice
                    ? 'Tap card to select'
                    : 'Click card to select'}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className='absolute inset-0 bg-black'>
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
            <span className='pointer-events-none absolute right-2 bottom-2 rounded-md bg-black/65 px-2 py-1 text-xs text-white'>
              {isTouchDevice ? 'Tap card to select' : 'Click card to select'}
            </span>
          </div>
        )}
        {!isFlipped && (
          <>
            <Button
              size='icon-sm'
              variant='ghost'
              onClick={handleFlip}
              className='absolute top-2 left-2 z-20 bg-black/45 text-white hover:bg-black/65 hover:text-white'
            >
              <Info />
            </Button>
            <Button
              type='button'
              onClick={handlePreviewToggle}
              aria-label={
                isPreviewPlaying ? 'Pause preview video' : 'Play preview video'
              }
              className='absolute top-2 right-2 z-10 rounded-full bg-black/65 p-2 text-white shadow-md transition hover:scale-105 hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none'
            >
              {isPreviewPlaying ? (
                <Pause className='size-4 fill-current' />
              ) : (
                <Play className='size-4 fill-current' />
              )}
            </Button>
          </>
        )}
      </div>
      <CardFooter className='justify-center p-2 text-center'>
        <P className='text-sm'>{getDisplayName(exercise)}</P>
      </CardFooter>
    </Card>
  )
}

interface CardBackProps {
  exercise: Exercise
  isSelected: boolean
  handleFlip: (e: MouseEvent) => void
}

function CardBack({ exercise, isSelected, handleFlip }: CardBackProps) {
  return (
    <Card
      className={cn(
        'absolute inset-0 rotate-y-180 gap-0 overflow-hidden rounded-lg p-0 transition-all backface-hidden',
        isSelected &&
          'border-vital-blue-700 dark:border-vital-blue-800 border-2 ring-2 ring-cyan-300/35 dark:ring-cyan-500/35',
      )}
    >
      <CardHeader className='p-2 text-center'>
        <P>{getDisplayName(exercise)}</P>
      </CardHeader>
      <Separator />
      <CardContent className='flex-1 overflow-auto p-2'>
        <P className='text-muted-foreground text-sm'>{exercise.description}</P>
      </CardContent>
      <CardFooter className='justify-end p-2'>
        <Button variant='outline' onClick={handleFlip} type='button'>
          <RotateCcw className='mr-2 size-4 transition-transform group-hover:rotate-90' />
          Flip Back
        </Button>
      </CardFooter>
    </Card>
  )
}
