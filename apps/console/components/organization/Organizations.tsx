'use client'
import { createOrganizationAction } from '@/lib/actions'
import { Organization } from '@/types/models'
import { PlusSquare, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import placeholder from '@/public/placeholder.svg'

import { ChangeEvent, useActionState, useEffect, useRef, useState } from 'react'
import { Button } from '../ui/button'

interface OrganizationProps {
  userOrganizations: Organization[]
}

const initialState = { data: null }

const Organizations = ({ userOrganizations }: OrganizationProps) => {
  const [inputValue, setInputValue] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [formState, formAction, pending] = useActionState(
    createOrganizationAction,
    initialState,
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dialog.current?.open &&
        !dialogContainer.current?.contains(event.target as Node)
      ) {
        handleCloseDialog()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const dialog = useRef<null | HTMLDialogElement>(null)
  const dialogContainer = useRef<null | HTMLDivElement>(null)

  const handleCloseDialog = () => dialog.current?.close()
  const handleOpenDialog = () => dialog.current?.showModal()

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) =>
    setInputValue(e.target.value)
  return (
    <div className='flex justify-center'>
      <div className='w-full max-w-(--breakpoint-lg) p-4'>
        <header className='flex dark:text-zinc-200'>
          <h1 className='flex-1 self-center text-2xl font-bold'>
            Organizations
          </h1>
          <Button onClick={handleOpenDialog} variant='primary'>
            <PlusSquare /> organization
          </Button>
        </header>

        <ul className='mt-6 flex flex-col gap-4'>
          {userOrganizations &&
            userOrganizations.map((org) => (
              <li
                key={org.id}
                className='flex items-center gap-4 rounded-lg p-4 shadow-md dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-700/70'
              >
                <div className='mr-auto flex items-center gap-x-2'>
                  <Image
                    alt='user avatar'
                    src={org.logo ? org.logo : placeholder}
                    width={50}
                    height={50}
                    className='rounded-full border-2 border-zinc-600'
                  />
                  <div className=''>{org.name}</div>
                </div>
                <Link
                  href={`/organization/${org.id}`}
                  className='rounded-lg border border-zinc-600 p-2 hover:bg-zinc-600/60'
                >
                  Manage
                </Link>
              </li>
            ))}
        </ul>

        <dialog
          ref={dialog}
          className='inset-0 rounded-lg bg-zinc-900 shadow-lg backdrop:backdrop-blur-md'
        >
          <div
            ref={dialogContainer}
            className='flex w-full max-w-xl flex-col gap-4 rounded-lg bg-zinc-900 p-8 dark:text-zinc-200'
          >
            <header className='flex'>
              <h1 className='flex-1'>Create organization</h1>
              <button onClick={handleCloseDialog}>
                <X />
              </button>
            </header>
            <p>
              Create a new organization. To get started, name your new
              organization.
            </p>
            <form action={formAction}>
              <div className='flex flex-col'>
                <label htmlFor='slug' hidden></label>
                <input
                  type='text'
                  name='slug'
                  id='slug'
                  defaultValue={inputValue
                    .toLocaleLowerCase()
                    .replace(' ', '-')}
                  hidden
                />
                <label
                  htmlFor='name'
                  className='font-medium text-gray-800 dark:text-zinc-200'
                >
                  Organization name:
                </label>
                <input
                  type='text'
                  name='name'
                  id='name'
                  value={inputValue}
                  onChange={handleOnChange}
                  className='selection:bg-vital-blue-300 hover:border-vital-blue-400 focus:border-vital-blue-400 flex-1 rounded-md border-b-2 border-b-transparent p-1 text-zinc-700 outline-offset-[3px] dark:bg-zinc-700 dark:text-zinc-200'
                />
              </div>
              <div className='mt-6 flex justify-end gap-2'>
                <Button
                  type='button'
                  onClick={handleCloseDialog}
                  variant='destructive'
                >
                  Cancel
                </Button>
                <Button type='submit' variant='primary'>
                  Submit
                </Button>
              </div>
            </form>
          </div>
        </dialog>
      </div>
    </div>
  )
}

export default Organizations
