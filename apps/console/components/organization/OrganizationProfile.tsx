'use client'
import DeleteOrg from '@/components/organization/DeleteOrg'
import InviteMember from '@/components/organization/InviteMember'
import {
  deleteOrganizationAction,
  updateOrganizationAction,
} from '@/lib/actions'
import { Session } from 'better-auth'
import capitalize from 'lodash.capitalize'
import Image from 'next/image'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { OrganizationWithMembers } from '@/types/models'

interface OrganizationProfileProps {
  session: Session
  organization: OrganizationWithMembers
}

const OrganizationProfile = ({
  session,
  organization,
}: OrganizationProfileProps) => {
  return (
    <div className='mx-auto w-full max-w-(--breakpoint-lg)'>
      <section className='flex gap-4 p-4'>
        <div className='flex flex-col dark:text-zinc-200'>
          <h2>Organization name</h2>
          <p>{"This is your organization's visible name."}</p>
        </div>
        <form
          action={updateOrganizationAction}
          className='flex items-center gap-2'
        >
          <input
            type='text'
            id='id'
            name='id'
            defaultValue={organization?.id}
            hidden
          />
          <Input
            type='text'
            id='name'
            name='name'
            defaultValue={organization?.name}
          />
          <Button
            type='submit'
            className='bg-vital-blue-500 hover:bg-vital-blue-600 flex rounded-md px-2 py-1 text-white'
          >
            Save
          </Button>
        </form>
      </section>
      <InviteMember organization={organization} />
      <section className='p-4 dark:text-zinc-200'>
        <h2>Members</h2>
        <ul>
          {organization.members?.length ? (
            organization.members.map((member) => (
              <li
                key={member.id}
                className='flex gap-4 rounded-lg p-4 shadow-md dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-700/70'
              >
                <div className='mr-auto grid items-center gap-x-2'>
                  {member.user.image ? (
                    <Image
                      width={100}
                      height={100}
                      src={member.user.image}
                      alt='Member image'
                      className='row-span-2 flex h-[35px] w-[35px] items-center justify-center rounded-full border-2'
                    />
                  ) : null}
                  <div className='col-start-2'>{member.user.name}</div>
                  <div className='col-start-2 text-sm font-light text-zinc-300'>
                    {capitalize(member.role)}
                  </div>
                </div>
                <Button asChild>
                  <Link
                    href={`/user/${member.id}`}
                    className='rounded-lg border border-zinc-600 p-2 hover:bg-zinc-600/60'
                  >
                    Manage
                  </Link>
                </Button>
              </li>
            ))
          ) : (
            <p>No members yet</p>
          )}
        </ul>
      </section>
      <section className='p-4'>
        <div className='flex items-center gap-4 rounded-lg p-4 shadow-md dark:bg-zinc-700 dark:text-zinc-200'>
          <div className='mr-auto'>
            <h2>
              {organization.isFrozen
                ? 'Reactivate the organization'
                : 'Deactivate the organization'}
            </h2>
            {organization.isFrozen && (
              <p className='text-xs'>
                When you deactivate an organization, all associated resources
                will be deleted. You can reactivate an organization at any time.
              </p>
            )}
          </div>
          <form action={updateOrganizationAction}>
            <input
              type='text'
              id='id'
              name='id'
              defaultValue={organization.id}
              hidden
            />
            <input
              type='text'
              defaultValue={organization.isFrozen ? 'true' : 'false'}
              id='deactivate'
              name='isFrozen'
              hidden
            />
            <Button
              type='submit'
              className='rounded-lg bg-yellow-600 p-2 hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-500'
            >
              {organization.isFrozen ? 'Reactivate' : 'Deactivate'}
            </Button>
          </form>
        </div>
      </section>
      <DeleteOrg
        session={session}
        organization={organization}
        deleteOrganizationAction={deleteOrganizationAction}
      />
    </div>
  )
}

export default OrganizationProfile
