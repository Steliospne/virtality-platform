'use client'
import Image from 'next/image'
import placeholder from '@/public/placeholder.svg'
import { Input } from '@virtality/ui/components/input'
import { ChangeEvent, Fragment, useCallback, useState } from 'react'
import { Button } from '@virtality/ui/components/button'
import { toast } from 'react-toastify'
import { authClient } from '@/auth-client'
import { FieldMeta, getConsoleUrl } from '@virtality/shared/types'
import usePageViewTracking from '@/hooks/analytics/use-page-view-tracking'
import { ControllerRenderProps, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
import { Field, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field'
import { Separator } from '@virtality/ui/components/separator'
import { UserSchema } from '@virtality/db/definitions'
import {
  type ActivePendingPasswordChange,
  useActivePendingPasswordChange,
  useCancelPendingPasswordChange,
  useHasPassword,
  useListAccounts,
  useORPC,
  useResendPendingPasswordChange,
  useStartPasswordChange,
  useStartPasswordSetup,
  useUpdateUserInfo,
} from '@virtality/react-query'
import z from 'zod/v4'
import {
  isValidPassword,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '@virtality/shared/utils'
import { Trash2, UserIcon, X } from 'lucide-react'
import { SOCIAL_PROVIDERS } from '@/data/static/providers'
import { Badge } from '@virtality/ui/components/badge'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { ControllerField } from '@/components/ui/controller'
import { Account } from 'better-auth'
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'

const baseURL = getConsoleUrl()

type UserForm = Pick<z.infer<typeof UserSchema>, 'name' | 'phoneNumber'> & {
  image?: File | string | null
}

const BasicInfoFormSchema = UserSchema.extend({
  image: z.instanceof(File).or(z.string()).optional().nullable(),
  phoneNumber: z.string().nullable(),
}).pick({ name: true, phoneNumber: true, image: true })

type EmailForm = Pick<z.infer<typeof UserSchema>, 'email'>

const EmailFormSchema = UserSchema.pick({ email: true })

const PasswordFormSchema = z.object({
  currentPassword: z.string().nonempty('Current password is required').trim(),
  newPassword: z.string().trim().check(isValidPassword),
})

const SetPasswordFormSchema = z.object({
  newPassword: z.string().trim().check(isValidPassword),
})

type PasswordForm = z.infer<typeof PasswordFormSchema>
type SetPasswordForm = z.infer<typeof SetPasswordFormSchema>

const basicInfoFormFields = {
  image: {
    label: 'Image',
    description: 'Click on the photo to upload a custom one.',
    hint: 'The image will be used as your profile picture.',
  },
  name: {
    label: 'Name',
    placeholder: 'John Doe',
    description: 'Please enter your full name.',
    hint: 'Please use 32 characters at maximum.',
  },
  phoneNumber: {
    label: 'Phone Number',
    placeholder: '+1234567890',
    description: 'Please enter your phone number.',
    hint: 'A code will be sent to verify.',
  },
} satisfies FieldMeta<UserForm>

const emailFormField = {
  email: {
    label: 'Email',
    placeholder: 'example@domain.com',
    description:
      'Your primary email will be used for account-related notifications.',
    hint: 'Emails must be verified to be used as primary email.',
  },
} satisfies FieldMeta<EmailForm>

const passwordFormField = {
  currentPassword: {
    label: 'Current Password',
    placeholder: '********',
    description: 'Please enter your current password.',
    hint: 'Please enter your current password.',
  },
  newPassword: {
    label: 'New Password',
    placeholder: '********',
    description: 'Please enter your new password.',
    hint: 'Please enter your new password.',
  },
} satisfies FieldMeta<PasswordForm>

type SessionUser = NonNullable<
  ReturnType<typeof authClient.useSession>['data']
>['user']

const toFormValues = (user: SessionUser | undefined): UserForm => ({
  name: user?.name ?? '',
  phoneNumber: user?.phoneNumber ?? '',
  image: user?.image ?? null,
})

interface ProfileInfoProps {
  user: SessionUser
}

const ProfileInfo = ({ user }: ProfileInfoProps) => {
  const { refetch: refetchSession } = authClient.useSession()

  const { data: hasPassword, isLoading: isLoadingHasPassword } =
    useHasPassword()
  const {
    data: activePendingPasswordChange,
    isLoading: isLoadingPendingPasswordChange,
  } = useActivePendingPasswordChange()

  usePageViewTracking({
    props: { route_group: 'user', tab_view: 'user-profile' },
  })

  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)

  const basicInfoForm = useForm<UserForm>({
    resolver: zodResolver(BasicInfoFormSchema),
    defaultValues: toFormValues(user),
  })

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(EmailFormSchema),
    defaultValues: { email: user?.email ?? '' },
  })

  const syncFormFromSession = useCallback(async () => {
    await refetchSession({ query: { disableCookieCache: true } })

    const { data: freshSession } = await authClient.getSession({
      query: { disableCookieCache: true },
    })

    const freshUser = freshSession?.user
    if (!freshUser) return

    basicInfoForm.reset(toFormValues(freshUser), { keepDirty: false })
  }, [basicInfoForm, refetchSession])

  const { mutate: updateUserInfo, isPending: isUpdatingUser } =
    useUpdateUserInfo({
      onSuccess: async () => {
        toast.success('Profile updated successfully')
        await syncFormFromSession()
      },
      onError: (error) => {
        console.error(error)
        toast.error('Failed to update profile')
      },
    })

  const onSubmitBasicInfo = (data: UserForm) => {
    updateUserInfo({
      name: data.name,
      phoneNumber: data.phoneNumber ?? null,
      image: data.image ?? undefined,
    })
  }

  const onSubmitEmail = async (data: EmailForm) => {
    if (data.email === user.email) return

    setIsUpdatingEmail(true)

    await authClient.changeEmail({
      newEmail: data.email,
      callbackURL: `${baseURL}/user/${user.id}/profile`,
      fetchOptions: {
        onSuccess: () =>
          void toast.success(
            'Please check your new email for a verification link.',
          ),
        onError: (error) => {
          console.error(error)
          toast.error('Failed to update email')
        },
      },
    })

    setIsUpdatingEmail(false)

    emailForm.reset({ email: user.email ?? '' }, { keepDirty: false })
  }

  const handleDeleteUser = async () => {
    setIsDeleting(true)
    await authClient.deleteUser({
      callbackURL: baseURL + '/goodbye',
    })
    setIsDeleting(false)
  }

  return (
    <div className='flex flex-col gap-6 rounded-lg'>
      <Card>
        <form onSubmit={basicInfoForm.handleSubmit(onSubmitBasicInfo)}>
          <CardContent>
            <FieldGroup className='mb-6'>
              <ControllerField
                name='image'
                control={basicInfoForm.control}
                meta={basicInfoFormFields['image']}
              >
                {({ field }) => <ImageField field={field} user={user} />}
              </ControllerField>

              {(['name', 'phoneNumber'] as const).map((name) => (
                <Fragment key={name}>
                  <Separator />
                  <ControllerField
                    name={name}
                    meta={basicInfoFormFields[name]}
                    control={basicInfoForm.control}
                  >
                    {({ field, fieldState }) => (
                      <Input
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        placeholder={basicInfoFormFields[name].placeholder}
                        value={(field.value ?? '') as string}
                      />
                    )}
                  </ControllerField>
                </Fragment>
              ))}

              <Separator />

              <SignInMethods />
            </FieldGroup>
          </CardContent>
          <CardFooter className='border-t'>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                basicInfoForm.reset(toFormValues(user), { keepDirty: false })
              }}
              disabled={!basicInfoForm.formState.isDirty || isUpdatingUser}
            >
              Clear Changes
            </Button>
            <Button
              type='submit'
              className='ml-auto'
              disabled={!basicInfoForm.formState.isDirty || isUpdatingUser}
            >
              {isUpdatingUser ? 'Saving...' : 'Save'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <form onSubmit={emailForm.handleSubmit(onSubmitEmail)}>
          <CardContent>
            <FieldGroup className='mb-6'>
              <ControllerField
                name='email'
                control={emailForm.control}
                meta={emailFormField['email']}
              >
                {({ field, fieldState }) => (
                  <Input
                    {...field}
                    id={field.name}
                    type='email'
                    name={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder={emailFormField['email'].placeholder}
                    value={(field.value ?? '') as string}
                  />
                )}
              </ControllerField>
            </FieldGroup>
          </CardContent>
          <CardFooter className='border-t'>
            <Button
              type='submit'
              className='ml-auto'
              disabled={!emailForm.formState.isDirty || isUpdatingEmail}
            >
              {isUpdatingEmail ? 'Saving...' : 'Change'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-xl font-bold'>Password</CardTitle>
        </CardHeader>

        <PasswordCardBody
          isLoading={isLoadingHasPassword || isLoadingPendingPasswordChange}
          hasPassword={hasPassword}
          activePendingPasswordChange={activePendingPasswordChange}
        />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delete Account</CardTitle>
        </CardHeader>
        <CardContent>
          Permanently remove your Personal Account and all of its contents from
          Virtality. This action is not reversible, so please continue with
          caution.
        </CardContent>
        <CardFooter className='border-t'>
          <Button
            type='submit'
            variant='destructive'
            onClick={handleDeleteUser}
            disabled={isDeleting}
            className='ml-auto'
          >
            {isDeleting ? 'Deleting...' : 'Delete account'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default ProfileInfo

const PENDING_PASSWORD_KIND_LABEL = {
  SETUP: 'Password setup',
  CHANGE: 'Password change',
} as const satisfies Record<ActivePendingPasswordChange['kind'], string>

const PENDING_PASSWORD_CANCEL_SUCCESS = {
  SETUP: 'Password setup request cancelled.',
  CHANGE: 'Password change request cancelled.',
} as const satisfies Record<ActivePendingPasswordChange['kind'], string>

const invalidateActivePendingPasswordChange = async (
  queryClient: QueryClient,
  orpc: ReturnType<typeof useORPC>,
) => {
  await queryClient.invalidateQueries({
    queryKey: orpc.pendingPasswordChange.getActive.key(),
  })
}

const PasswordCardBody = ({
  isLoading,
  hasPassword,
  activePendingPasswordChange,
}: {
  isLoading: boolean
  hasPassword: boolean | undefined
  activePendingPasswordChange: ActivePendingPasswordChange | null | undefined
}) => {
  if (isLoading) {
    return (
      <>
        <CardContent>
          <Skeleton className='h-10 w-full' />
        </CardContent>
        <CardFooter className='border-t'>
          <Skeleton className='ml-auto h-10 w-24' />
        </CardFooter>
      </>
    )
  }

  if (activePendingPasswordChange) {
    return <PendingPasswordState pending={activePendingPasswordChange} />
  }

  if (hasPassword) {
    return <PasswordField />
  }

  return <SetPasswordField />
}

const SignInMethods = () => {
  const orpc = useORPC()
  const queryClient = useQueryClient()
  const { data: accounts } = useListAccounts()

  const handleUnlinkAccount = async (account: Account) => {
    await authClient.unlinkAccount({
      providerId: account.providerId,
      fetchOptions: {
        onSuccess: () => {
          toast.success('Account unlinked successfully')

          queryClient.invalidateQueries({
            queryKey: orpc.account.list.key(),
          })
        },
        onError: (error) => {
          console.error(error)
          toast.error('Failed to unlink account')
        },
      },
    })
  }

  return (
    <Field>
      <FieldSet>
        <div className='text-xl font-bold'>Sign-in methods</div>
        {accounts?.map((account) => {
          const provider = SOCIAL_PROVIDERS.find(
            (provider) => provider.name === account.providerId,
          )

          if (account.providerId === 'credential') return

          return (
            <Badge key={account.id} variant='outline' className='gap-2 p-2'>
              <span className='text-sm' style={{ color: provider?.color }}>
                {provider?.icon}
              </span>
              <span className='text-sm capitalize'>{provider?.name}</span>
              <div className='border-l pl-2'>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => handleUnlinkAccount(account)}
                    >
                      <X />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side='bottom'>
                    Unlink
                    <TooltipArrow className='dark:fill-white' />
                  </TooltipContent>
                </Tooltip>
              </div>
            </Badge>
          )
        })}
      </FieldSet>
    </Field>
  )
}

type AvatarState = {
  previewUrl: string | null
  hasImage: boolean
  isImageHovered: boolean
}

interface ImageFieldProps {
  field: ControllerRenderProps<UserForm, 'image'>
  user: SessionUser
  previewReset?: () => void
}

const ImageField = ({ field, user }: ImageFieldProps) => {
  const [avatarState, setAvatarState] = useState<AvatarState>({
    previewUrl: null,
    hasImage: user?.image ? true : false,
    isImageHovered: false,
  })

  const handleMouseEnter = () => {
    if (!avatarState.hasImage) return
    setAvatarState({ ...avatarState, isImageHovered: true })
  }

  const handleMouseLeave = () => {
    if (!avatarState.hasImage) return
    setAvatarState({ ...avatarState, isImageHovered: false })
  }

  const removeImage = () => {
    setAvatarState({ previewUrl: null, hasImage: false, isImageHovered: false })
    field.onChange(null)
  }

  const handlePhotoUpload = (
    event: ChangeEvent<HTMLInputElement>,
    field: ControllerRenderProps<UserForm, 'image'>,
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      field.onChange(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarState({
          ...avatarState,
          previewUrl: e.target?.result as string,
          hasImage: true,
          isImageHovered: false,
        })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <FieldLabel
      htmlFor={field.name}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className='border-vital-blue-700 relative ml-auto size-24! cursor-pointer overflow-hidden rounded-full border-2 bg-slate-100 shadow-lg'
    >
      {avatarState.isImageHovered && avatarState.hasImage && (
        <Button
          type='button'
          size='icon'
          variant='ghost'
          onClick={removeImage}
          className='absolute z-10 size-full rounded-full text-red-500 hover:bg-zinc-500/50 hover:text-red-500'
        >
          <Trash2 className='size-6' />
        </Button>
      )}
      {avatarState.hasImage ? (
        <Image
          height={200}
          width={200}
          alt='Patient'
          src={
            avatarState.previewUrl
              ? avatarState.previewUrl
              : user?.image
                ? user.image
                : placeholder
          }
          className='size-full object-cover'
        />
      ) : (
        <div className='flex size-full items-center justify-center bg-linear-to-br from-slate-200 to-slate-300'>
          <UserIcon className='size-12 text-zinc-400' />
        </div>
      )}

      <Input
        type='file'
        accept='image/*'
        name={field.name}
        id={field.name}
        hidden
        onChange={(e) => {
          handlePhotoUpload(
            e,
            field as ControllerRenderProps<UserForm, 'image'>,
          )
        }}
      />
    </FieldLabel>
  )
}

const PasswordField = () => {
  const orpc = useORPC()
  const queryClient = useQueryClient()
  const changePasswordForm = useForm<PasswordForm>({
    resolver: zodResolver(PasswordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  })

  const { mutate: startPasswordChange, isPending } = useStartPasswordChange({
    onSuccess: async () => {
      changePasswordForm.reset(
        { currentPassword: '', newPassword: '' },
        { keepDirty: false },
      )
      await queryClient.invalidateQueries({
        queryKey: orpc.pendingPasswordChange.getActive.key(),
      })
      toast.success('Check your email to approve the password change.')
    },
    onError: (error) => {
      console.error(error)
      toast.error('Failed to start password change')
    },
  })

  const onSubmitChangePassword = (data: PasswordForm) => {
    startPasswordChange({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    })
  }

  return (
    <form onSubmit={changePasswordForm.handleSubmit(onSubmitChangePassword)}>
      <CardContent>
        <FieldGroup className='mb-6'>
          <ControllerField
            name='currentPassword'
            control={changePasswordForm.control}
            meta={passwordFormField['currentPassword']}
            labelClassName='text-base'
          >
            {({ field, fieldState }) => (
              <Input
                {...field}
                id={field.name}
                type='password'
                name={field.name}
                aria-invalid={fieldState.invalid}
                placeholder={passwordFormField['currentPassword'].placeholder}
                value={(field.value ?? '') as string}
              />
            )}
          </ControllerField>
          <ControllerField
            labelClassName='text-base'
            name='newPassword'
            control={changePasswordForm.control}
            meta={passwordFormField['newPassword']}
          >
            {({ field, fieldState }) => (
              <Input
                {...field}
                id={field.name}
                type='password'
                name={field.name}
                aria-invalid={fieldState.invalid}
                placeholder={passwordFormField['newPassword'].placeholder}
                value={(field.value ?? '') as string}
              />
            )}
          </ControllerField>
        </FieldGroup>
      </CardContent>
      <CardFooter className='border-t'>
        <Button
          type='submit'
          className='ml-auto'
          disabled={!changePasswordForm.formState.isDirty || isPending}
        >
          {isPending ? 'Sending...' : 'Change'}
        </Button>
      </CardFooter>
    </form>
  )
}

const setPasswordFormField = {
  newPassword: {
    label: 'New Password',
    placeholder: '********',
    description: 'Choose a password for email and password sign-in.',
    hint: `Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters with upper, lower, and digit.`,
  },
} satisfies FieldMeta<SetPasswordForm>

const SetPasswordField = () => {
  const orpc = useORPC()
  const queryClient = useQueryClient()
  const setPasswordForm = useForm<SetPasswordForm>({
    resolver: zodResolver(SetPasswordFormSchema),
    defaultValues: { newPassword: '' },
  })

  const { mutate: startPasswordSetup, isPending } = useStartPasswordSetup({
    onSuccess: async () => {
      setPasswordForm.reset({ newPassword: '' }, { keepDirty: false })
      await invalidateActivePendingPasswordChange(queryClient, orpc)
      toast.success('Check your email to approve password setup.')
    },
    onError: (error) => {
      console.error(error)
      toast.error('Failed to start password setup')
    },
  })

  const onSubmitSetPassword = (data: SetPasswordForm) => {
    startPasswordSetup({ newPassword: data.newPassword })
  }

  return (
    <form onSubmit={setPasswordForm.handleSubmit(onSubmitSetPassword)}>
      <CardContent>
        <p className='text-muted-foreground mb-4 text-sm'>
          You have not set a password yet. Add one to sign in with email and
          password.
        </p>
        <FieldGroup className='mb-6'>
          <ControllerField
            labelClassName='text-base'
            name='newPassword'
            control={setPasswordForm.control}
            meta={setPasswordFormField['newPassword']}
          >
            {({ field, fieldState }) => (
              <Input
                {...field}
                id={field.name}
                type='password'
                name={field.name}
                aria-invalid={fieldState.invalid}
                placeholder={setPasswordFormField['newPassword'].placeholder}
                value={(field.value ?? '') as string}
              />
            )}
          </ControllerField>
        </FieldGroup>
      </CardContent>
      <CardFooter className='border-t'>
        <Button
          type='submit'
          className='ml-auto'
          disabled={!setPasswordForm.formState.isDirty || isPending}
        >
          {isPending ? 'Sending...' : 'Set Password'}
        </Button>
      </CardFooter>
    </form>
  )
}

const PendingPasswordState = ({
  pending,
}: {
  pending: ActivePendingPasswordChange
}) => {
  const orpc = useORPC()
  const queryClient = useQueryClient()
  const { kind, destinationEmail, expiresAt } = pending
  const expiry = new Date(expiresAt)

  const { mutate: resend, isPending: isResending } =
    useResendPendingPasswordChange({
      onSuccess: async () => {
        await invalidateActivePendingPasswordChange(queryClient, orpc)
        toast.success('Approval email resent.')
      },
      onError: (error) => {
        console.error(error)
        toast.error('Failed to resend approval email')
      },
    })

  const { mutate: cancel, isPending: isCancelling } =
    useCancelPendingPasswordChange({
      onSuccess: async () => {
        await invalidateActivePendingPasswordChange(queryClient, orpc)
        toast.success(PENDING_PASSWORD_CANCEL_SUCCESS[kind])
      },
      onError: (error) => {
        console.error(error)
        toast.error('Failed to cancel pending password request')
      },
    })

  const isActionPending = isResending || isCancelling

  return (
    <>
      <CardContent className='space-y-2'>
        <p className='text-sm'>
          {PENDING_PASSWORD_KIND_LABEL[kind]} is pending approval. Check{' '}
          <span className='font-medium'>{destinationEmail}</span> for the
          approval email.
        </p>
        <p className='text-muted-foreground text-sm'>
          The approval link expires at {expiry.toLocaleString()}.
        </p>
      </CardContent>
      <CardFooter className='flex gap-2 border-t'>
        <Button
          type='button'
          variant='outline'
          disabled={isActionPending}
          onClick={() => cancel(undefined)}
        >
          {isCancelling ? 'Cancelling...' : 'Cancel request'}
        </Button>
        <Button
          type='button'
          className='ml-auto'
          disabled={isActionPending}
          onClick={() => resend(undefined)}
        >
          {isResending ? 'Resending...' : 'Resend email'}
        </Button>
      </CardFooter>
    </>
  )
}
