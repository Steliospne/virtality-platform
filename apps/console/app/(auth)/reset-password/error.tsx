'use client'
import { Button } from '@/components/ui/button'
import { H2, P } from '@/components/ui/typography'
import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    // Log the error to an error reporting service
  }, [error])

  return (
    <div className='flex h-screen flex-col items-center justify-center'>
      <H2>Something went wrong!</H2>
      <P>
        Cause: <span className='text-red-500'>{error.message}</span>
      </P>
      <Button variant='link'>
        <Link href='/'>Go back</Link>
      </Button>
    </div>
  )
}
