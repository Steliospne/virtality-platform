'use client'
import Image from 'next/image'
import placeholder from '@/public/placeholder.svg'
import { Input } from '@/components/ui/input'
import { ChangeEvent, useActionState, useEffect, useRef, useState } from 'react'
import {
  // handlePhoneVerification,
  // handleSendOTP,
  updateUserAction,
} from '@/lib/actions'
import { Button } from '@/components/ui/button'
import SuccessToasty from '@/components/ui/SuccessToasty'
import { authClient, type User } from '@/auth-client'
import { useClientT } from '@/i18n/use-client-t'
import {
  CONSOLE_URL,
  CONSOLE_URL_LOCAL,
  CONSOLE_URL_STAGING,
} from '@virtality/shared/types'
import usePageViewTracking from '@/hooks/analytics/use-page-view-tracking'

const env = process.env.NEXT_PUBLIC_ENV || 'development'

const baseURL =
  env === 'production'
    ? CONSOLE_URL
    : env === 'preview'
      ? CONSOLE_URL_STAGING
      : CONSOLE_URL_LOCAL

const initialState = {
  data: null,
}

interface ProfileInfoProps {
  user: User
}

const ProfileInfo = ({ user }: ProfileInfoProps) => {
  usePageViewTracking({
    props: { route_group: 'user', tab_view: 'user-profile' },
  })
  const { i18n } = useClientT()
  const [formState, formAction, pending] = useActionState(
    updateUserAction,
    initialState,
  )
  const [userFormData, setUserFormData] = useState<User>(user)
  const [isPending, setPending] = useState(false)

  const initialUserData = useRef<User>(user)

  const handleOnChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value, name } = event.target

    setUserFormData((prevState) => {
      return { ...prevState, [name]: value }
    })
  }

  useEffect(() => {
    if (formState?.data) {
      initialUserData.current = {
        ...initialUserData.current,
        ...formState.data,
      }
      setUserFormData(initialUserData.current)
      SuccessToasty('Profile updated successfully!')
    }
  }, [formState])

  const handleDeleteUser = async () => {
    setPending(true)
    await authClient.deleteUser({
      callbackURL: baseURL + '/goodbye',
    })
    setPending(false)
  }

  return (
    <div className='flex flex-col gap-6 rounded-lg'>
      {/* Photo card */}
      <div className='relative flex flex-col rounded-lg border shadow-md dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200'>
        <form action={formAction}>
          <div className='p-4'>
            <h2 className='text-xl font-bold'>Photo</h2>
            <div className='my-4'>
              <p>{`This is your photo.`}</p>
              <p>{`Click on the photo to upload a custom one from your files.`}</p>
            </div>
          </div>
          <footer className='flex items-center border-t p-4 text-sm dark:border-zinc-600'>
            <div className='text-sm text-zinc-400'>
              A photo is optional but strongly recommended.
            </div>
          </footer>
          <div className='absolute top-4 right-4 overflow-hidden rounded-full'>
            <Image
              src={userFormData.image ? userFormData.image : placeholder}
              alt='Profile'
              width={96}
              height={96}
            />
          </div>
        </form>
      </div>

      <div className='relative flex flex-col rounded-lg border shadow-md dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200'>
        <form action={formAction}>
          <div className='p-4'>
            <h2 className='text-xl font-bold'>Name</h2>
            <div className='my-4'>
              <p>{`Please enter your full name.`}</p>
            </div>
            <Input
              type='text'
              name='name'
              id='name'
              maxLength={32}
              value={userFormData.name ?? ''}
              onChange={handleOnChange}
              className='mb-4 w-[300px] px-4'
            />
          </div>
          <footer className='flex items-center border-t p-4 text-sm text-zinc-400 dark:border-zinc-600'>
            <div className='flex-1'>Please use 32 characters at maximum.</div>
            <Button
              type='submit'
              disabled={
                pending ||
                userFormData.name === '' ||
                initialUserData.current['name'] === userFormData.name
              }
            >
              Save
            </Button>
          </footer>
        </form>
      </div>

      <div className='relative flex flex-col rounded-lg border shadow-md dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200'>
        <form action={formAction}>
          <div className='p-4'>
            <h2 className='text-xl font-bold'>Email</h2>
            <div className='my-4'>
              <p>{`Your primary email will be used for account-related notifications.`}</p>
            </div>
            <Input
              type='email'
              name='email'
              id='email'
              value={userFormData.email ?? ''}
              onChange={handleOnChange}
              className='mb-4 w-[300px] px-4'
            />
          </div>
          <footer className='flex items-center border-t p-4 text-sm text-zinc-400 dark:border-zinc-600'>
            <div className='flex-1'>
              Emails must be verified to be used as primary email.
            </div>
            <Button
              type='submit'
              variant='default'
              disabled={
                pending ||
                userFormData.email === '' ||
                initialUserData.current['email'] === userFormData.email
              }
            >
              Save
            </Button>
          </footer>
        </form>
      </div>

      <div className='relative flex flex-col rounded-lg border shadow-md dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200'>
        <form action={formAction}>
          <div className='p-4'>
            <h2 className='text-xl font-bold'>Phone Number</h2>
            <div className='my-4'>
              <p>{`Enter a phone number to receive important service updates by SMS.`}</p>
            </div>
            <Input
              type='phoneNumber'
              name='phoneNumber'
              id='phoneNumber'
              value={userFormData.phoneNumber ?? ''}
              onChange={handleOnChange}
              className='mb-4 w-[300px] px-4'
            />
          </div>
          <footer className='flex items-center border-t p-4 text-sm text-zinc-400 dark:border-zinc-600'>
            <div className='flex-1'>A code will be sent to verify.</div>
            <Button
              type='submit'
              disabled={
                pending ||
                userFormData.phoneNumber === '' ||
                initialUserData.current['phoneNumber'] ===
                  userFormData.phoneNumber
              }
            >
              Save
            </Button>
          </footer>
        </form>
      </div>

      <div className='relative flex flex-col rounded-lg border shadow-md dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200'>
        <div className='p-4'>
          <h2 className='text-xl font-bold'>Delete Account</h2>
          <div className='my-4'>
            <div className='flex-1'>
              Permanently remove your Personal Account and all of its contents
              from Virtality. This action is not reversible, so please continue
              with caution.
            </div>
          </div>
        </div>
        <footer className='flex items-center border-t p-4 text-sm text-zinc-400 dark:border-zinc-600'>
          <Button
            type='submit'
            variant='destructive'
            onClick={handleDeleteUser}
            disabled={isPending}
            className='ml-auto'
          >
            {isPending ? 'Deleting...' : 'Delete account'}
          </Button>
        </footer>
      </div>
    </div>
  )
}

export default ProfileInfo
