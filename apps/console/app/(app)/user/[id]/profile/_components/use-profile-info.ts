'use client'
import { useCallback, useState } from 'react'
import { toast } from 'react-toastify'
import { authClient } from '@/auth-client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import {
  useORPC,
  useStartAccountDeletion,
  useUpdateUserInfo,
} from '@virtality/react-query'
import { invalidateActivePendingAccountDeletion } from './profile-info-form'
import {
  baseURL,
  BasicInfoFormSchema,
  EmailFormSchema,
  toFormValues,
  type EmailForm,
  type SessionUser,
  type UserForm,
} from './profile-info-form'

export const useProfileInfo = (user: SessionUser) => {
  const { refetch: refetchSession } = authClient.useSession()
  const orpc = useORPC()
  const queryClient = useQueryClient()

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

  const { mutate: startAccountDeletion, isPending: isStartingDeletion } =
    useStartAccountDeletion({
      onSuccess: async () => {
        await invalidateActivePendingAccountDeletion(queryClient, orpc)
        toast.success('Check your email to approve account deletion.')
      },
      onError: (error) => {
        console.error(error)
        toast.error('Failed to start account deletion')
      },
    })

  const handleDeleteUser = () => {
    startAccountDeletion(undefined)
  }

  return {
    isStartingDeletion,
    isUpdatingEmail,
    isUpdatingUser,
    basicInfoForm,
    emailForm,
    onSubmitBasicInfo,
    onSubmitEmail,
    handleDeleteUser,
  }
}
