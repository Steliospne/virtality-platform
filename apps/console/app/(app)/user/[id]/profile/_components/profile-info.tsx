'use client'
import { Input } from '@virtality/ui/components/input'
import { Fragment } from 'react'
import { Button } from '@virtality/ui/components/button'
import usePageViewTracking from '@/hooks/analytics/use-page-view-tracking'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
import { FieldGroup } from '@/components/ui/field'
import { Separator } from '@virtality/ui/components/separator'
import {
  useActivePendingAccountDeletion,
  useActivePendingPasswordChange,
  useHasPassword,
} from '@virtality/react-query'
import { ControllerField } from '@/components/ui/controller'
import { ImageField } from './profile-image-field'
import { PasswordCardBody } from './profile-password-card-body'
import { PendingAccountDeletionState } from './profile-pending-account-deletion-state'
import { SignInMethods } from './profile-sign-in-methods'
import { useProfileInfo } from './use-profile-info'
import {
  basicInfoFormFields,
  emailFormField,
  toFormValues,
  type SessionUser,
} from './profile-info-form'

interface ProfileInfoProps {
  user: SessionUser
}

const ProfileInfo = ({ user }: ProfileInfoProps) => {
  const { data: hasPassword, isLoading: isLoadingHasPassword } =
    useHasPassword()
  const {
    data: activePendingPasswordChange,
    isLoading: isLoadingPendingPasswordChange,
  } = useActivePendingPasswordChange()
  const {
    data: activePendingAccountDeletion,
    isLoading: isLoadingPendingAccountDeletion,
  } = useActivePendingAccountDeletion()

  usePageViewTracking({
    props: { route_group: 'user', tab_view: 'user-profile' },
  })

  const {
    isStartingDeletion,
    isUpdatingEmail,
    isUpdatingUser,
    basicInfoForm,
    emailForm,
    onSubmitBasicInfo,
    onSubmitEmail,
    handleDeleteUser,
  } = useProfileInfo(user)

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
        {isLoadingPendingAccountDeletion ? null : activePendingAccountDeletion ? (
          <PendingAccountDeletionState pending={activePendingAccountDeletion} />
        ) : (
          <>
            <CardContent>
              Permanently remove your Personal Account and all of its contents
              from Virtality. This action is not reversible, so please
              continue with caution.
            </CardContent>
            <CardFooter className='border-t'>
              <Button
                type='submit'
                variant='destructive'
                onClick={handleDeleteUser}
                disabled={isStartingDeletion}
                className='ml-auto'
              >
                {isStartingDeletion ? 'Starting...' : 'Delete account'}
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  )
}

export default ProfileInfo
