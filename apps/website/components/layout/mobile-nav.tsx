'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MenuIcon } from 'lucide-react'
import {
  SiFacebook,
  SiInstagram,
  SiLinkedin,
  SiX,
} from '@icons-pack/react-simple-icons'
import { Button } from '@virtality/ui/components/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@virtality/ui/components/sheet'

type MobileNavProps = {
  facebookUrl: string
  instagramUrl: string
  linkedinUrl: string
  xUrl: string
}

const navLinkClassName =
  'text-base font-medium text-slate-700 hover:text-vital-blue-700 dark:text-gray-300 dark:hover:text-vital-blue-500 transition-colors'

const MobileNav = ({
  facebookUrl,
  instagramUrl,
  linkedinUrl,
  xUrl,
}: MobileNavProps) => {
  const pathname = usePathname()
  const showHomeLink = pathname !== '/'

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='text-slate-600 md:hidden dark:text-gray-300'
          aria-label='Open menu'
        >
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side='right' className='w-[min(100%,20rem)]'>
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className='flex flex-col gap-6 px-4'>
          <div className='flex flex-col gap-3'>
            {showHomeLink ? (
              <SheetClose asChild>
                <Link href='/' className={navLinkClassName}>
                  Home
                </Link>
              </SheetClose>
            ) : null}
            <SheetClose asChild>
              <Link href='/blog' className={navLinkClassName}>
                Blog
              </Link>
            </SheetClose>
          </div>

          <div className='flex flex-col gap-3'>
            <p className='text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-zinc-400'>
              Media
            </p>
            <div className='flex items-center gap-6 text-slate-600'>
              <SheetClose asChild>
                <Link href={facebookUrl} target='_blank' aria-label='Facebook'>
                  <SiFacebook className='size-4.5 transition-all hover:scale-110 hover:text-[#0866FF]' />
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href={instagramUrl}
                  target='_blank'
                  aria-label='Instagram'
                >
                  <SiInstagram className='size-4.5 transition-all hover:scale-110 hover:text-[#E4405F]' />
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link href={linkedinUrl} target='_blank' aria-label='LinkedIn'>
                  <SiLinkedin className='size-4.5 transition-all hover:scale-110 hover:text-[#0A66C2]' />
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link href={xUrl} target='_blank' aria-label='X'>
                  <SiX className='size-4.5 transition-all hover:scale-110 hover:text-[#000000] dark:hover:text-white' />
                </Link>
              </SheetClose>
            </div>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}

export default MobileNav
