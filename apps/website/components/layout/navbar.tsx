import { NavigationMenu } from '@virtality/ui/components/navigation-menu'
import { Button } from '@virtality/ui/components/button'
import { Separator } from '@virtality/ui/components/separator'
import Link from 'next/link'
import Image from 'next/image'
import {
  SiFacebook,
  SiInstagram,
  SiLinkedin,
  SiX,
} from '@icons-pack/react-simple-icons'
import ScrollToCtaButton from '@/components/shared/scroll-to-cta-button'
import MobileNav from '@/components/layout/mobile-nav'
import { NAV_BOOK_DEMO_LABEL } from '@/sections/hero'
import { getConsoleUrl } from '@virtality/shared/types'

const consoleURL = getConsoleUrl()

const X_URL = process.env.X_URL
const LINKEDIN_URL = process.env.LINKEDIN_URL
const FACEBOOK_URL = process.env.FACEBOOK_URL
const INSTAGRAM_URL = process.env.INSTAGRAM_URL

if (!X_URL || !LINKEDIN_URL || !FACEBOOK_URL || !INSTAGRAM_URL) {
  throw new Error('Social media URLs are not set')
}

const Navbar = async () => {
  return (
    <NavigationMenu className='border-vital-blue-100/50 sticky top-0 z-20 flex h-15 max-w-full justify-between border-b bg-white/80 px-4 backdrop-blur-md backdrop-saturate-180 dark:border-zinc-800 dark:bg-zinc-900/80'>
      <Link href='/' className='transition-opacity hover:opacity-80'>
        <Image
          src='/virtality_small_rounded.png'
          alt='Virtality Logo'
          width={32}
          height={32}
          preload
        />
      </Link>

      <div className='flex items-center gap-2'>
        <div className='hidden items-center gap-2 md:flex'>
          <div className='flex justify-center gap-6 text-slate-600'>
            <Link href={FACEBOOK_URL} target='_blank'>
              <SiFacebook className='size-4.5 transition-all hover:scale-110 hover:text-[#0866FF]' />
            </Link>
            <Link href={INSTAGRAM_URL} target='_blank'>
              <SiInstagram className='size-4.5 transition-all hover:scale-110 hover:text-[#E4405F]' />
            </Link>
            <Link href={LINKEDIN_URL} target='_blank'>
              <SiLinkedin className='size-4.5 transition-all hover:scale-110 hover:text-[#0A66C2]' />
            </Link>
            <Link href={X_URL} target='_blank'>
              <SiX className='size-4.5 transition-all hover:scale-110 hover:text-[#000000] dark:hover:text-white' />
            </Link>
          </div>

          <Separator orientation='vertical' className='ml-4 h-6!' />

          <Button
            asChild
            variant='link'
            className='text-slate-600 dark:text-gray-300'
          >
            <Link href='/blog'>Blog</Link>
          </Button>
        </div>

        <ScrollToCtaButton
          variant='outline'
          className='border-vital-blue-700 text-vital-blue-700 hover:bg-vital-blue-50 font-semibold'
        >
          {NAV_BOOK_DEMO_LABEL}
        </ScrollToCtaButton>
        <Button
          asChild
          className='bg-vital-blue-700 hover:bg-vital-blue-800 shadow-vital-blue-700/20 font-semibold text-white shadow-md'
        >
          <Link href={consoleURL}>Login</Link>
        </Button>

        <MobileNav
          facebookUrl={FACEBOOK_URL}
          instagramUrl={INSTAGRAM_URL}
          linkedinUrl={LINKEDIN_URL}
          xUrl={X_URL}
        />
      </div>
    </NavigationMenu>
  )
}

export default Navbar
