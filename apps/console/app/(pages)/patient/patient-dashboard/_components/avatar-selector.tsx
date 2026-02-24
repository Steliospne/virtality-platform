import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Avatar } from '@virtality/db'
import { X, Info } from 'lucide-react'
import Image from 'next/image'
import placeholder from '@/public/placeholder.svg'
import { MouseEvent } from 'react'
import { usePatientDashboard } from '@/context/patient-dashboard-context'
import { Button } from '@/components/ui/button'
import usePatient from '@/hooks/queries/patient/use-patient'
import useAvatar from '@/hooks/queries/use-avatar'

const AvatarSelector = () => {
  const { state, handler, store, patientLocalData, patientId } =
    usePatientDashboard()
  const { selectedAvatar, programState } = state
  const { setSelectedAvatar } = handler
  const { data: avatars } = useAvatar()
  const { data: patient } = usePatient({ patientId })

  const avatarChange = (value: string) => {
    const avatar = avatars?.find((avatar) => avatar.id === value) ?? null
    store?.setRow('patients', patient!.id, {
      ...patientLocalData,
      lastAvatar: avatar?.id ?? '',
    })
    setSelectedAvatar(avatar)
  }

  const avatarSelectionClear = (e: MouseEvent) => {
    e.stopPropagation()
    store?.delCell('patients', patient!.id, 'lastAvatar')
    setSelectedAvatar(null)
  }

  const isProgramActive = programState === 'started'
  const isProgramPaused = programState === 'paused'

  return (
    <div className='relative'>
      <Select value={selectedAvatar?.id ?? ''} onValueChange={avatarChange}>
        <SelectTrigger
          disabled={isProgramActive || isProgramPaused}
          className='w-full border dark:border-zinc-600 dark:bg-zinc-900'
        >
          {selectedAvatar ? (
            <AvatarCard avatar={selectedAvatar} />
          ) : (
            <SelectValue placeholder='Select an Avatar' />
          )}
        </SelectTrigger>
        <SelectContent className='dark:bg-zinc-900'>
          {avatars &&
            avatars.map((avatar) => (
              <SelectItem key={avatar.id} value={avatar.id}>
                <AvatarCard avatar={avatar} />
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      {selectedAvatar && (
        <Button
          disabled={isProgramActive || isProgramPaused}
          variant='ghost'
          size='icon-sm'
          onClick={avatarSelectionClear}
          className='absolute top-1.5 right-8 size-6 cursor-pointer hover:bg-zinc-700/90'
        >
          <X />
        </Button>
      )}
    </div>
  )
}

export default AvatarSelector

const AvatarCard = ({ avatar }: { avatar: Avatar }) => {
  return (
    <div className='flex items-center gap-2'>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Info />
            </div>
          </TooltipTrigger>

          <TooltipContent asChild>
            <Card className='max-w-(--breakpoint-sm) gap-2 bg-zinc-50 p-4 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-200'>
              <CardContent className='p-0'>
                <Image
                  alt='Avatar image'
                  width={150}
                  height={150}
                  loading='eager'
                  src={avatar.image ? avatar.image : placeholder}
                  className='rounded-lg'
                />
              </CardContent>
              <CardFooter className='p-0'>
                <CardTitle className='text-xl'>{avatar.name}</CardTitle>
              </CardFooter>
              <TooltipArrow />
            </Card>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <p>{avatar.name}</p>
    </div>
  )
}
