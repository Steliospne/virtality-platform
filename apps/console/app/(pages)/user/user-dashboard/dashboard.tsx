'use client'
import { Button } from '@/components/ui/button'
import JoyrideWrapper from '@/components/ui/joyride-wrapper'
import { CallBackProps } from '@virtality/react-joyride'
import { useTour } from '@/context/tour-context'
import { useRouter } from 'next/navigation'
import { authClient, User } from '@/auth-client'
import { steps } from '@/data/static/tour/steps'
import { CheckSquare, GripVertical, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChangeEvent, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const Dashboard = ({ user }: { user: User }) => {
  const { state, setState } = useTour()
  const [open, setOpen] = useState(false)
  const [host, setHost] = useState('')

  const router = useRouter()

  const handleDeviceTour = () => {
    setState({ ...state, isDropdownOpen: true })
    setTimeout(
      () =>
        setState((prev) => ({
          ...prev,
          activeTour: true,
          run: true,
        })),
      500,
    )
  }

  const handlePatientTour = () => {
    setState({ ...state, stepIndex: 3, run: true, activeTour: true })
  }

  const tourCallback = (data: CallBackProps) => {
    const { action, index, lifecycle } = data

    const userDevicesURL = `/user/${user.id}/devices`
    const patientsURL = `/patients`

    switch (action) {
      case 'next':
        if (index === 0 && !state.mission.device) {
          setState({ ...state, isDropdownOpen: true, stepIndex: 1 })
          break
        } else if (index === 1 && lifecycle === 'complete') {
          setState({
            ...state,
            stepIndex: 2,
            isDropdownOpen: false,
            run: false,
          })
          router.push(userDevicesURL)
          break
        } else if (index === 3 && lifecycle === 'complete') {
          setState({
            ...state,
            stepIndex: 4,
            run: false,
          })
          router.push(patientsURL)
        }
        break
      case 'prev':
        if (index === 1) {
          setState({ ...state, isDropdownOpen: true, stepIndex: 0 })
        }
        break

      case 'skip':
        setState({
          ...state,
          run: false,
          activeTour: false,
          isDropdownOpen: false,
          stepIndex: 0,
        })
        break

      default:
        break
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const target = e.currentTarget
    const { value } = target
    setHost(value)
  }

  const handleImpersonate = async () => {
    if (host === '') return

    const { error } = await authClient.admin.impersonateUser({
      userId: host, // required
    })

    if (error) {
      console.error('[Error]: ', error.code, ', message: ', error.message)
      return
    }

    setHost('')
    window.location.reload()
  }

  const handleStopImpersonate = async () => {
    const { error } = await authClient.admin.stopImpersonating()
    if (error) {
      console.error('[Error]: ', error.code, ', message: ', error.message)
      return
    }
    window.location.reload()
  }

  const testVerificationEmail = async () => {
    try {
      await authClient.sendVerificationEmail({
        email: 's.pnevmatikakis@virtality.app',
        callbackURL: 'http://localhost:3001',
      })
    } catch (error) {
      console.log('Error sending verification email: ', error)
    }
  }

  return (
    <div className='max-h-screen-with-header relative flex flex-col items-center gap-6 overflow-hidden pt-20'>
      <Popover open={open}>
        <PopoverTrigger asChild>
          {user.role === 'admin' && (
            <Button
              onClick={() => setOpen(!open)}
              className='absolute top-10 right-0 h-10 rounded-l-full pr-1 hover:w-11.5'
            >
              <GripVertical />
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent>
          <div className='grid grid-rows-2 gap-1'>
            <Label htmlFor='userId'>User ID</Label>
            <Input
              type='text'
              id='userId'
              value={host}
              onChange={handleInputChange}
            />

            <Button onClick={handleImpersonate}>Impersonate</Button>
            <Button onClick={handleStopImpersonate}>Stop Impersonate</Button>
            <Button onClick={testVerificationEmail}>Send Email</Button>
          </div>
        </PopoverContent>
      </Popover>

      <h1>Complete the Tour.</h1>
      <ol className='list-decimal space-y-4'>
        <li>
          <div className='flex items-center gap-2'>
            {state.mission.device ? (
              <CheckSquare className='text-green-500' />
            ) : (
              <Square />
            )}
            <p className={cn(state.mission.device && 'line-through')}>
              Pair your first device.
            </p>
            <Button
              variant='outline'
              size='sm'
              disabled={state.mission.device}
              onClick={handleDeviceTour}
            >
              Begin
            </Button>
          </div>
        </li>

        <li>
          <div className='flex gap-2'>
            {state.mission.patient ? (
              <CheckSquare className='text-green-500' />
            ) : (
              <Square />
            )}
            <p className={cn(state.mission.patient && 'line-through')}>
              Create your first patient.
            </p>
            <Button
              variant='outline'
              size='sm'
              disabled={state.mission.patient || !state.mission.device}
              onClick={handlePatientTour}
            >
              Begin
            </Button>
          </div>
        </li>
        <li>
          <div
            className={cn(
              'flex gap-2',
              state.mission.program && 'line-through',
            )}
          >
            {state.mission.program ? (
              <CheckSquare className='text-green-500' />
            ) : (
              <Square />
            )}
            <p className=''>Create your first program.</p>
            <Button
              variant='outline'
              size='sm'
              disabled={state.mission.program || !state.mission.patient}
            >
              Begin
            </Button>
          </div>
        </li>
      </ol>
      <JoyrideWrapper
        continuous
        steps={steps}
        run={state.run}
        stepIndex={state.stepIndex}
        styles={{ overlay: { height: 'auto' } }}
        callback={tourCallback}
        hideBackButton
        disableCloseOnEsc
        disableOverlayClose
        debug
      />
    </div>
  )
}

export default Dashboard
