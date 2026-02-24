'use client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Lock, Play, CreditCard } from 'lucide-react'
import Link from 'next/link'

const NoPlan = () => {
  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center'>
            <Lock className='w-8 h-8 text-primary' />
          </div>
          <CardTitle className='text-2xl font-bold'>
            Subscription Required
          </CardTitle>
          <CardDescription className='text-base'>
            We see that you are not yet subscribed to continue accessing our
            premium features and content.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Button asChild variant='primary' className='w-full' size='lg'>
            <Link href='/pricing'>
              <CreditCard className='mr-2' />
              View Pricing
            </Link>
          </Button>
          <Button asChild variant='outline' className='w-full' size='lg'>
            <Link href='/demo'>
              <Play className='mr-2' />
              Try Demo
            </Link>
          </Button>
          <p className='text-xs text-muted-foreground text-center mt-4'>
            {
              "Choose a plan that works for you or explore our demo see what you're missing."
            }
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default NoPlan
