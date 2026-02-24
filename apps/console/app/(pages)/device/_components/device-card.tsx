'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff } from 'lucide-react'
import { VRDevice } from '@/types/models'
import useSocketConnection from '@/hooks/use-socket-connection'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import useDeviceCardState from '@/hooks/use-device-card-state'
import { Input } from '@/components/ui/input'
import placeholder from '@/public/placeholder.svg'
import MetaQuest3 from '@/public/meta_quest_3.webp'
import MetaQuest3s from '@/public/meta_quest_3s.webp'
import DeviceCardSkeleton from './device-card-skeleton'
import { H3, P } from '@/components/ui/typography'
import { cn } from '@/lib/utils'
import useDevice from '@/hooks/queries/use-device'
import { getQueryClient } from '@/integrations/tanstack-query/provider'
import useSetDeviceId from '@/hooks/mutations/device/use-set-device-id'
import { orpc } from '@/integrations/orpc/client'

interface DeviceProps {
  device: VRDevice
}

const DeviceCard = ({ device }: DeviceProps) => {
  const { queryClient } = getQueryClient()
  const connected = useSocketConnection({ device })
  const { removeDevice } = useDevice()

  const { state, handler } = useDeviceCardState({
    device,
    connected,
  })

  const {
    status,
    isCodeFieldOpen,
    error,
    verificationCode,
    isRePairDialogOpen,
  } = state

  const {
    startPairing,
    cancelPairing,
    resetPairing,
    setRePairDialogOpen,
    updateDeviceCardState,
    resetState,
  } = handler

  const { mutate: setDeviceId } = useSetDeviceId({
    onSuccess: () => {
      device?.socket.emit('sendDeviceIdAck')
      setTimeout(() => device?.socket.disconnect(), 1000)
      return queryClient.invalidateQueries({ queryKey: orpc.device.list.key() })
    },
  })

  const handleRemoveDevice = () => {
    resetState()
    device.socket.disconnect()
    removeDevice.mutate({ id: device.data.id })
  }

  const handlePairing = () => {
    startPairing()
    setCountdown(300)
  }

  useEffect(() => {
    const onDisconnect = () => {
      if (status === 'paired') return
      resetState()
    }

    const handleSendDeviceId = async (payload: string) => {
      if (payload && status === 'pairing') {
        setDeviceId({ id: device.data.id, deviceId: payload })

        updateDeviceCardState({
          status: 'paired',
          isCodeFieldOpen: false,
        })
      }
    }

    device?.socket.on('disconnect', onDisconnect)
    device?.socket.on('sendDeviceId', handleSendDeviceId)

    return () => {
      device?.socket.off('sendDeviceId', handleSendDeviceId)
      device?.socket.off('disconnect', onDisconnect)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device, status])

  const [countdown, setCountdown] = useState(300)

  useEffect(() => {
    if (countdown <= 0) return
    const interval = isCodeFieldOpen
      ? setInterval(() => {
          setCountdown((prev) => prev - 1)
        }, 1000)
      : undefined
    return () => clearInterval(interval)
  }, [countdown, isCodeFieldOpen])

  if (removeDevice.isPending) return <DeviceCardSkeleton />

  return (
    <>
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
            {status === 'paired' ? (
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
            <div className='text-muted-foreground flex items-center justify-between text-sm'>
              <P className='text-sm'>{device.data.model}</P>
              {isCodeFieldOpen && <span>Remaining time: {countdown} sec</span>}
            </div>
          </div>
        </CardContent>
        <CardFooter className=''>
          {isCodeFieldOpen ? (
            error ? (
              <div className='flex w-full flex-col'>
                <div className='flex gap-2'>
                  <Button onClick={cancelPairing} className='flex-1'>
                    Cancel
                  </Button>
                  <Button onClick={startPairing} className='flex-1'>
                    Retry
                  </Button>
                </div>
              </div>
            ) : (
              <div className='flex gap-2'>
                <Input
                  type='text'
                  name='verificationCode'
                  id='verificationCode'
                  value={verificationCode}
                  className='w-full text-center'
                  disabled
                />
                <Button onClick={cancelPairing}>Cancel</Button>
              </div>
            )
          ) : (
            <div className='flex w-full gap-2'>
              <Button
                variant={'destructive'}
                disabled={status === 'pairing'}
                onClick={handleRemoveDevice}
                className='flex-1'
              >
                {'Remove Device'}
              </Button>
              <Button
                variant={'default'}
                onClick={handlePairing}
                className='flex-1'
              >
                {'Pair Device'}
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      <Dialog open={isRePairDialogOpen} onOpenChange={setRePairDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='text-yellow-500'>Warning!</DialogTitle>
            <hr />
          </DialogHeader>
          <p>You are about to re-pair your headset.</p>
          <DialogFooter>
            <Button onClick={setRePairDialogOpen}>Cancel</Button>
            <Button variant='primary' onClick={resetPairing}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default DeviceCard
