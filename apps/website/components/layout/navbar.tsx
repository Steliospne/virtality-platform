import { NavigationMenu } from '@/components/ui/navigation-menu'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import SmallLogo from '@/components/logo/small-logo'
import {
  SiFacebook,
  SiInstagram,
  SiLinkedin,
  SiX,
} from '@icons-pack/react-simple-icons'

const Navbar = async () => {
  const appURL = process.env.APP_DOMAIN_URL

  return (
    <NavigationMenu className='h-[60px] max-w-full sticky top-0 z-20 backdrop-blur-md backdrop-saturate-[180%] bg-white/80 dark:bg-zinc-900/80 flex justify-between px-4 border-b border-vital-blue-100/50 dark:border-zinc-800'>
      <Link href='/' className='hover:opacity-80 transition-opacity'>
        <SmallLogo className='size-8' />
      </Link>

      <div className='flex justify-center gap-6'>
        <Link href={process.env.NEXT_PUBLIC_FACEBOOK_URL ?? '#'}>
          <SiFacebook
            className={`size-5 hover:text-[#0866FF] hover:scale-110 transition-all`}
          />
        </Link>
        <Link href={process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? '#'}>
          <SiInstagram
            className={`size-5 hover:text-[#E4405F] hover:scale-110 transition-all`}
          />
        </Link>
        <Link href={process.env.NEXT_PUBLIC_LINKEDIN_URL ?? '#'}>
          <SiLinkedin
            className={`size-5 hover:text-[#0A66C2] hover:scale-110 transition-all`}
          />
        </Link>
        <Link href={process.env.NEXT_PUBLIC_X_URL ?? '#'}>
          <SiX
            className={`size-5 hover:text-[#000000] dark:hover:text-white hover:scale-110 transition-all`}
          />
        </Link>
      </div>

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
          <Link href={`${appURL}`}>Login</Link>
        </Button>
      </div>
    </NavigationMenu>
  )
}

export default Navbar
