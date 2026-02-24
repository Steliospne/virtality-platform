'use client'

import { Organization } from '@/types/models'
import { X } from 'lucide-react'
import { Session } from 'better-auth'
import { ChangeEvent, useRef, useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

interface DeleteOrgProps {
  session: Session
  organization: Organization
  deleteOrganizationAction: (formData: FormData) => Promise<void>
}

const DeleteOrg = ({
  session,
  organization,
  deleteOrganizationAction,
}: DeleteOrgProps) => {
  const warningPopUp = useRef<null | HTMLDialogElement>(null)
  const [inputConfirmation, setInputConfirmation] = useState('')
  const handleDeleteWarning = () => {
    if (warningPopUp.current?.open) warningPopUp.current.close()
    else warningPopUp.current?.showModal()
  }
  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputConfirmation(value)
  }
  return (
    <>
      <section className='p-4'>
        <div className='flex items-center gap-4 rounded-lg p-4 shadow-md dark:bg-zinc-700 dark:text-zinc-200'>
          <div className='mr-auto'>
            <h2>Delete the organization</h2>
            <footer className='text-xs'>
              Permanently delete the organization. The organization must first
              be deactivated before it can be deleted.
            </footer>
          </div>
          <Button
            onClick={handleDeleteWarning}
            disabled={!organization.isFrozen}
            variant='destructive'
          >
            Delete
          </Button>
        </div>
      </section>

      <dialog
        ref={warningPopUp}
        className='relative inset-0 w-full max-w-md rounded-lg shadow-lg backdrop:backdrop-blur-md dark:bg-zinc-900'
      >
        <section className='flex flex-col gap-4 p-4 dark:text-zinc-200'>
          <h1 className='mx-auto text-xl'>{organization.name}</h1>
          <p>
            You are about to permanently delete your organization this action
            cannot be reversed.
          </p>
          <div className='flex flex-col gap-2'>
            <label htmlFor='confirm'>
              {`To confirm, type `}
              <b>{`${organization.name}`}</b>
              {` in the box below`}
            </label>
            <Input
              value={inputConfirmation}
              type='text'
              id='confirm'
              onChange={handleOnChange}
              autoComplete='off'
            />
          </div>
          <form action={deleteOrganizationAction} className='mx-auto'>
            <input
              type='text'
              id='organizationId'
              name='organizationId'
              defaultValue={organization.id}
              hidden
            />
            <input
              type='text'
              defaultValue={session?.userId}
              id='userId'
              name='userId'
              hidden
            />
            <Button
              type='submit'
              disabled={inputConfirmation !== organization.name ? true : false}
              variant='destructive'
            >
              Delete
            </Button>
          </form>
        </section>
        <Button
          onClick={handleDeleteWarning}
          variant='ghost'
          className='absolute top-[16px] right-[16px]'
          size='icon'
        >
          <X />
        </Button>
      </dialog>
    </>
  )
}

export default DeleteOrg
