'use client'

import Image from 'next/image'
import { MouseEvent, useEffect, useRef } from 'react'
import { Pause, Play } from 'lucide-react'
import { Button } from '@virtality/ui/components/button'
import { Item, ItemContent, ItemTitle } from '@/components/ui/item'
import { getDisplayName } from '@/lib/utils'
import type { StarterTemplatePreviewExercise } from '@/lib/starter-template-create'

interface StarterTemplateExercisePreviewItemProps {
  exercise: StarterTemplatePreviewExercise
  isPlaying: boolean
  onPlayingChange: (playing: boolean) => void
}

const StarterTemplateExercisePreviewItem = ({
  exercise,
  isPlaying,
  onPlayingChange,
}: StarterTemplateExercisePreviewItemProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const label = getDisplayName(exercise) ?? exercise.displayName

  useEffect(() => {
    if (!isPlaying) {
      videoRef.current?.pause()
      return
    }

    void videoRef.current?.play().catch(() => {
      onPlayingChange(false)
    })
  }, [isPlaying, onPlayingChange])

  const handlePreviewToggle = (e: MouseEvent) => {
    e.stopPropagation()
    if (!exercise.video) return
    onPlayingChange(!isPlaying)
  }

  return (
    <Item variant='outline' size='sm' className='gap-3'>
      <div className='bg-muted relative size-24 shrink-0 overflow-hidden rounded-md'>
        {!isPlaying ? (
          <Image
            src={exercise.image ?? '/placeholder.svg'}
            alt={`${label} thumbnail`}
            fill
            className='object-contain'
            sizes='96px'
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

        {exercise.video ? (
          <Button
            type='button'
            onClick={handlePreviewToggle}
            aria-label={
              isPlaying ? 'Pause preview video' : 'Play preview video'
            }
            className='absolute top-1/2 left-1/2 z-10 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/65 p-0 text-white shadow-md transition hover:scale-105 hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none'
          >
            {isPlaying ? (
              <Pause className='size-3.5 fill-current' />
            ) : (
              <Play className='size-3.5 fill-current' />
            )}
          </Button>
        ) : null}
      </div>

      <ItemContent>
        <ItemTitle>{label}</ItemTitle>
      </ItemContent>
    </Item>
  )
}

export default StarterTemplateExercisePreviewItem
