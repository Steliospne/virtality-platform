import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'

const GoodbyePage = () => {
  const baseURL = process.env.NEXT_PUBLIC_CDN_URL
  return (
    <section className='flex h-screen items-center justify-center'>
      <Card className='w-full max-w-2xl space-y-6 p-8 text-center md:p-12'>
        <div className='space-y-4'>
          <div className='bg-primary/10 mb-2 inline-flex size-24 items-center justify-center rounded-full'>
            <Image
              alt='Company small logo'
              width={50}
              height={50}
              src={`${baseURL}/small_logo_400x400.png`}
            />
          </div>

          <h1 className='text-3xl font-bold text-balance md:text-4xl'>
            {"We're sorry to see you go"}
          </h1>

          <p className='text-muted-foreground mx-auto max-w-xl text-lg leading-relaxed text-pretty'>
            Your account has been successfully deleted. We appreciate the time
            you spent with us and hope we were able to help you along the way.
          </p>
        </div>

        <div className='space-y-4 pt-4'>
          <div className='bg-muted/50 space-y-3 rounded-lg p-6'>
            <h2 className='text-foreground font-semibold'>
              What happens next?
            </h2>
            <ul className='text-muted-foreground mx-auto max-w-md space-y-2 text-left text-sm'>
              <li className='flex items-start gap-2'>
                <span className='text-primary mt-0.5'>•</span>
                <span>
                  All your personal data has been permanently removed from our
                  systems
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-primary mt-0.5'>•</span>
                <span>
                  You will no longer receive any emails or notifications from us
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-primary mt-0.5'>•</span>
                <span>
                  {
                    "You're always welcome to create a new account if you change your mind"
                  }
                </span>
              </li>
            </ul>
          </div>

          <div className='flex flex-col justify-center gap-3 pt-2 sm:flex-row'>
            <Button asChild variant='default' size='lg'>
              <Link href='/'>Return to Homepage</Link>
            </Button>
            <Button asChild variant='outline' size='lg'>
              <Link href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/contact`}>
                Share Feedback
              </Link>
            </Button>
          </div>
        </div>

        <div className='border-t pt-6'>
          <p className='text-muted-foreground text-sm'>
            Thank you for being part of our community. We wish you all the best!
          </p>
        </div>
      </Card>
    </section>
  )
}

export default GoodbyePage
