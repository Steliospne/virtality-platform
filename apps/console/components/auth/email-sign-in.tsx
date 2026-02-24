'use client'
import { authClient } from '@/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ChangeEvent, useState } from 'react'

const EmailSignIn = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [signInData, setSignInData] = useState<
    { [name: string]: string } | undefined
  >()

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const target = e.target
    const { value, name } = target
    setSignInData({ ...signInData, [name]: value })
  }

  const handleSignIn = async () => {
    if (signInData) {
      setLoading(true)
      const { error } = await authClient.signIn.email({
        ...(signInData as { email: string; password: string }),
        fetchOptions: {
          onSuccess: () => {
            router.push('/')
          },
        },
      })
      if (error?.message) {
        setLoading(false)
        setAuthError(error.message)
      }
    }
  }

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex flex-col gap-2'>
        <Label htmlFor='email' className='text-sm font-medium'>
          Email
        </Label>
        <Input
          type='email'
          id='email'
          name='email'
          required
          onChange={handleInputChange}
        />
      </div>
      <div className='flex flex-col gap-2'>
        <Label htmlFor='password' className='text-sm font-medium'>
          Password
        </Label>
        <Input
          type='password'
          id='password'
          name='password'
          required
          onChange={handleInputChange}
        />
      </div>
      <Button type='submit' size='lg' onClick={handleSignIn}>
        {loading ? <Loader2 className='animate-spin' /> : 'Sign In'}
      </Button>
      {authError && <div className='text-red-500'>{authError}</div>}
    </div>
  )
}

export default EmailSignIn
