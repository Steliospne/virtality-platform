'use client'
import Image from 'next/image'
import placeholder from '@/public/placeholder.svg'
import { Input } from '@virtality/ui/components/input'
import { ChangeEvent, Fragment, useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-toastify'
import { authClient } from '@/auth-client'
import {
  CONSOLE_URL,
  CONSOLE_URL_LOCAL,
  CONSOLE_URL_STAGING,
  FieldMeta,
} from '@virtality/shared/types'
import usePageViewTracking from '@/hooks/analytics/use-page-view-tracking'
import { ControllerRenderProps, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field'
import { Separator } from '@virtality/ui/components/separator'
import { UserSchema } from '@virtality/db/definitions'
import {
  useListAccounts,
  useORPC,
  useUpdateUserInfo,
} from '@virtality/react-query'
import z from 'zod/v4'
import { Trash2, UserIcon, X } from 'lucide-react'
import { SOCIAL_PROVIDERS } from '@/data/static/providers'
import { Badge } from '@virtality/ui/components/badge'
import { useQueryClient } from '@tanstack/react-query'
import { ControllerField } from '@/components/ui/controller'
import { Account } from 'better-auth'
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const env = process.env.NEXT_PUBLIC_ENV || 'development'

const baseURL =
  env === 'production'
    ? CONSOLE_URL
    : env === 'preview'
      ? CONSOLE_URL_STAGING
      : CONSOLE_URL_LOCAL

type UserForm = Pick<z.infer<typeof UserSchema>, 'name' | 'phoneNumber'> & {
  image?: File | string | null
}

const BasicInfoFormSchema = UserSchema.extend({
  image: z.instanceof(File).or(z.string()).optional().nullable(),
  phoneNumber: z.string().nullable(),
}).pick({ name: true, phoneNumber: true, image: true })

type EmailForm = Pick<z.infer<typeof UserSchema>, 'email'>

const EmailFormSchema = UserSchema.pick({ email: true })

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
            disabled={isDeleting}
            className='ml-auto'
          >
            {isDeleting ? 'Deleting...' : 'Delete account'}
          </Button>
        </footer>
      </div>
    </div>
  )
}

export default ProfileInfo

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
