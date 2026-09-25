'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@virtality/ui/components/button'
import { Input } from '@virtality/ui/components/input'
import {
  IMMERSIVE_STOP_AFTER_CUSTOM_MAX,
  IMMERSIVE_STOP_AFTER_CUSTOM_MIN,
  parseCustomStopAfter,
} from '@/lib/immersive-video-auto-stop'

/** Any whole number of minutes; prefilled with the current limit. */
export function ImmersiveVideoStopAfterCustomForm({
  stopAfterMin,
  elapsedSec,
  onApply,
}: {
  stopAfterMin: number | null
  elapsedSec: number | null
  onApply: (minutes: number) => void
}) {
  const [raw, setRaw] = useState(
    stopAfterMin == null ? '' : String(stopAfterMin),
  )
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = parseCustomStopAfter({ raw, elapsedSec })
    if (!result.ok) {
      setError(result.error)
      return
    }
    onApply(result.minutes)
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-1 p-2'>
      <label htmlFor='stop-after-custom' className='text-sm font-medium'>
        Custom (minutes)
      </label>
      <div className='flex gap-2'>
        <Input
          id='stop-after-custom'
          type='number'
          inputMode='numeric'
          min={IMMERSIVE_STOP_AFTER_CUSTOM_MIN}
          max={IMMERSIVE_STOP_AFTER_CUSTOM_MAX}
          step={1}
          value={raw}
          aria-invalid={error != null}
          aria-describedby={error ? 'stop-after-custom-error' : undefined}
          onChange={(event) => {
            setRaw(event.target.value)
            setError(null)
          }}
          className='h-8'
        />
        <Button type='submit' size='sm'>
          Set
        </Button>
      </div>
      {error ? (
        <p id='stop-after-custom-error' className='text-destructive text-xs'>
          {error}
        </p>
      ) : null}
    </form>
  )
}
