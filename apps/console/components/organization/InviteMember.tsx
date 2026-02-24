'use client'
import { OrganizationWithMembers } from '@/types/models'
import { ChangeEvent, useActionState, useEffect, useState } from 'react'
import { createInvitationAction } from '@/lib/actions'
import { Input } from '../ui/input'
import { Button } from '../ui/button'

const initialState = { success: false, message: '' }

const InviteMember = ({
  organization,
}: {
  organization: OrganizationWithMembers
}) => {
  const [invitationEmail, setInvitationEmail] = useState('')
  const [state, formAction, pending] = useActionState(
    createInvitationAction,
    initialState,
  )

  const [isActive, setIsActive] = useState(false)
  useEffect(() => {
    const clear = isActive
      ? setInterval(() => {
          setIsActive(false)
        }, 2500)
      : undefined

    return () => clearInterval(clear)
  }, [isActive])

  useEffect(() => {
    if (state.success && !pending) {
      setIsActive(true)
    }
  }, [state.success, pending])

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInvitationEmail(value)
  }

  return (
    <section className='p-4 dark:text-zinc-200'>
      <h2 className='mb-4 font-semibold'>Invite a member</h2>
      <form action={formAction}>
        <div className='flex gap-4'>
          <div className='flex items-center gap-2'>
            <input
              type='text'
              id='organizationId'
              name='organizationId'
              defaultValue={organization.id}
              hidden
            />
            <label htmlFor='email'>Email</label>
            <Input
              type='email'
              id='email'
              name='email'
              disabled={organization.isFrozen ?? false}
              value={invitationEmail}
              placeholder='Enter email'
              onChange={handleOnChange}
              className='w-[250px]'
            />
          </div>
          <div className='flex items-center gap-2'>
            <label htmlFor='role'>Role</label>
            <select
              id='role'
              name='role'
              disabled={organization.isFrozen ?? false}
              className='focus:ring-vital-blue-500 dark:focus:ring-vital-blue-400 rounded-lg border px-2 py-1 focus:ring-2 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-500 dark:bg-zinc-600 dark:text-zinc-200'
            >
              <option value='Owner'>Owner</option>
              <option value='Employee'>Employee</option>
            </select>
          </div>
          <Button
            type='submit'
            disabled={organization.isFrozen || invitationEmail === ''}
          >
            {pending ? 'Sending...' : 'Invite'}
          </Button>
        </div>
        {isActive && (
          <p className='text-vital-blue-500'>
            The invitation was sent successfully
          </p>
        )}
      </form>
    </section>
  )
}

export default InviteMember
