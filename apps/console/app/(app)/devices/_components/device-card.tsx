'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@virtality/ui/components/button'
import { Card, CardContent, CardFooter } from '@virtality/ui/components/card'
import { Badge } from '@virtality/ui/components/badge'
import { Wifi, WifiOff } from 'lucide-react'
import { VRDevice } from '@/types/models'
import useSocketConnection from '@/hooks/use-socket-connection'
import useDeviceCardState from '@/hooks/use-device-card-state'
import { Input } from '@virtality/ui/components/input'
import placeholder from '@/public/placeholder.svg'
import MetaQuest3 from '@/public/meta_quest_3.webp'
import MetaQuest3s from '@/public/meta_quest_3s.webp'
import DeviceCardSkeleton from './device-card-skeleton'
import { H3, P } from '@/components/ui/typography'
import { cn } from '@/lib/utils'
import useDevice from '@/hooks/use-device'

interface DeviceProps {
  device: VRDevice
}

const DeviceCard = ({ device }: DeviceProps) => {
  const { connected } = useSocketConnection({ device })
  const { removeDevice } = useDevice()

  const { state, isStarting, isCancelling, handler } = useDeviceCardState({
    device,
  })

  const { status, isCodeFieldOpen, error, verificationCode, expiresAt } = state

  const { startPairing, cancelPairing, resetState } = handler

  const isPaired = status === 'paired' || Boolean(device.data.deviceId)
  const [countdown, setCountdown] = useState(300)

  const handleRemoveDevice = () => {
    resetState()
    device.socket.disconnect()
    removeDevice.mutate({ id: device.data.id })
  }

  const handlePairing = () => {
    void startPairing()
  }

  useEffect(() => {
    if (!isCodeFieldOpen || !expiresAt) return
    const updateCountdown = () => {
      const seconds = Math.max(
        0,
        Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000),
      )
      setCountdown(seconds)
    }
    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [expiresAt, isCodeFieldOpen])

  const renderFooterActions = () => {
    if (error && !isCodeFieldOpen) {
      return (
        <div className='flex w-full gap-2'>
          <Button
            onClick={() => void cancelPairing()}
            disabled={isCancelling}
            className='flex-1'
          >
            Cancel
          </Button>
          <Button
            onClick={handlePairing}
            disabled={isStarting}
            className='flex-1'
          >
            Retry
          </Button>
        </div>
      )
    }

    if (isCodeFieldOpen) {
      return (
        <div className='flex gap-2'>
          <Input
            type='text'
            name='verificationCode'
            id='verificationCode'
            value={verificationCode}
            className='w-full text-center'
            disabled
          />
          <Button onClick={() => void cancelPairing()} disabled={isCancelling}>
            Cancel
          </Button>
        </div>
      )
    }

    if (isPaired) {
      return (
        <Button
          variant='destructive'
          onClick={handleRemoveDevice}
          className='w-full'
        >
          Remove
        </Button>
      )
    }

    return (
      <div className='flex w-full gap-2'>
        <Button
          variant='destructive'
          disabled={status === 'pairing' || isStarting}
          onClick={handleRemoveDevice}
          className='flex-1'
        >
          Remove
        </Button>
        <Button
          variant='default'
          onClick={handlePairing}
          disabled={status === 'pairing' || isStarting}
          className='flex-1'
        >
          Pair
        </Button>
      </div>
    )
  }

  if (removeDevice.isPending) return <DeviceCardSkeleton />

  return (
    <Card className='aspect-4/5 w-full max-w-[320px] overflow-hidden'>
      <div className='relative h-48 bg-white'>
        <Image
          src={
            (device.data.model?.replaceAll(' ', '') === 'MetaQuest3' &&
              MetaQuest3) ||
            (device.data.model?.replaceAll(' ', '') === 'MetaQuest3S' &&
              MetaQuest3s) ||
            placeholder
          }
          alt={`${device.data.model} device`}
          fill
          priority
          sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
          className='object-contain p-4'
        />
        <Badge
          variant='outline'
          className='absolute -top-3 right-3 dark:bg-black dark:text-white'
        >
          {isPaired ? (
            <>
              <Wifi className='mr-1 size-3' /> Paired
            </>
          ) : (
            <>
              <WifiOff className='mr-1 size-3' /> Not Paired
            </>
          )}
        </Badge>
      </div>
      <CardContent>
        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <H3 className='truncate text-xl font-semibold'>
              {device.data.name}
            </H3>
            <span
              className={cn(
                'size-3 rounded-full',
                connected ? 'bg-green-500' : 'bg-red-500',
              )}
            ></span>
          </div>
          <div className='text-muted-foreground flex flex-col gap-1 text-sm'>
            <div className='flex items-center justify-between'>
              <P className='text-sm'>{device.data.model}</P>
              {isCodeFieldOpen && !error && (
                <span>Remaining time: {countdown} sec</span>
              )}
            </div>
            {status === 'pairing' && !isCodeFieldOpen && !error && (
              <P className='text-sm'>Preparing to pair...</P>
            )}
            {error && (
              <p className='text-destructive text-sm' role='alert'>
                {error}
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>{renderFooterActions()}</CardFooter>
    </Card>
  )
}

export default DeviceCard
