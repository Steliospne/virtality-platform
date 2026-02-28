import { NavigationMenu } from '@/components/ui/navigation-menu'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import Image from 'next/image'
import {
  SiFacebook,
  SiInstagram,
  SiLinkedin,
  SiX,
} from '@icons-pack/react-simple-icons'
import { CONSOLE_URL, CONSOLE_URL_LOCAL } from '@virtality/shared/types'

const consoleURL =
  process.env.NODE_ENV === 'production' ? CONSOLE_URL : CONSOLE_URL_LOCAL

const Navbar = async () => {
  return (
    <NavigationMenu className='h-[60px] max-w-full sticky top-0 z-20 backdrop-blur-md backdrop-saturate-180 bg-white/80 dark:bg-zinc-900/80 flex justify-between px-4 border-b border-vital-blue-100/50 dark:border-zinc-800'>
      <Link href='/' className='hover:opacity-80 transition-opacity'>
        <Image
          src='/virtality_small_rounded.png'
          alt='Virtality Logo'
          width={32}
          height={32}
          preload
        />
      </Link>

      <div className='flex items-center gap-2'>
        <div className='flex justify-center gap-6 text-slate-600'>
          <Link href={process.env.NEXT_PUBLIC_FACEBOOK_URL ?? '#'}>
            <SiFacebook
              className={`size-4.5 hover:text-[#0866FF] hover:scale-110 transition-all`}
            />
          </Link>
          <Link href={process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? '#'}>
            <SiInstagram
              className={`size-4.5 hover:text-[#E4405F] hover:scale-110 transition-all`}
            />
          </Link>
          <Link href={process.env.NEXT_PUBLIC_LINKEDIN_URL ?? '#'}>
            <SiLinkedin
              className={`size-4.5 hover:text-[#0A66C2] hover:scale-110 transition-all`}
            />
          </Link>
          <Link href={process.env.NEXT_PUBLIC_X_URL ?? '#'}>
            <SiX
              className={`size-4.5 hover:text-[#000000] dark:hover:text-white hover:scale-110 transition-all`}
            />
          </Link>
        </div>

        <Separator orientation='vertical' className='h-6! ml-4' />

        <div className='flex items-center gap-2'>
          <Button
            asChild
            variant='link'
            className='text-slate-600 dark:text-gray-300'
          >
            <Link href='/blog'>Blog</Link>
          </Button>
          <Button
            asChild
            className='bg-vital-blue-700 hover:bg-vital-blue-800 text-white font-semibold shadow-md shadow-vital-blue-700/20'
          >
            <Link href={consoleURL}>Login</Link>
          </Button>
        </div>
      </div>
    </NavigationMenu>
  )
}

export default Navbar
