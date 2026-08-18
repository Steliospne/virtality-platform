'use client'
import { Button } from '@virtality/ui/components/button'
import { toast } from 'react-toastify'
import { authClient } from '@/auth-client'
import { Field, FieldSet } from '@/components/ui/field'
import { useListAccounts, useORPC } from '@virtality/react-query'
import { X } from 'lucide-react'
import { SOCIAL_PROVIDERS } from '@/data/static/providers'
import { Badge } from '@virtality/ui/components/badge'
import { useQueryClient } from '@tanstack/react-query'
import { Account } from 'better-auth'
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export const SignInMethods = () => {
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
