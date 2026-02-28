'use client'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Check, LayoutDashboard, LinkIcon, Mail, Trash } from 'lucide-react'
import Avatar from './avatar'
import capitalize from 'lodash.capitalize'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import UserForm from '@/components/shared/user-form'
import { authClient } from '@/auth-client'
import { Skeleton } from '@/components/ui/skeleton'

const resourceList = ['avatar', 'map', 'exercises', 'user', 'patient', 'preset']

const adminActionList = ['create user']
const { useSession } = authClient

const Navbar = () => {
  const { isPending } = useSession()
  const [isNewUserDialogOpen, setNewUserDialogOpen] = useState(false)
  const pathname = usePathname()

  const handleResourcesClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Check if the device supports touch; only preventDefault for non-touch devices
    const hasTouch =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window ||
        (window.navigator.maxTouchPoints &&
          window.navigator.maxTouchPoints > 0))
    if (!hasTouch) {
      e.preventDefault()
    }
  }

  if (pathname === '/log-in' || pathname === '/no-access') return null

  if (isPending) return <Skeleton className='h-[60px]' />

  return (
    <header className='dark:bg-opacity-80 sticky top-0 z-10 col-span-2 col-start-1 flex h-[60px] bg-zinc-200 px-[8px] py-[4px] text-zinc-800 drop-shadow backdrop-blur-sm backdrop-saturate-180 dark:bg-zinc-950 dark:text-white'>
      <NavigationMenu viewport={false}>
        <NavigationMenuList className='gap-2'>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link href='/' className='flex flex-row items-center gap-2'>
                <LayoutDashboard />
                Dashboard
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger onClick={handleResourcesClick}>
              Resources
            </NavigationMenuTrigger>
            <NavigationMenuContent className='min-w-[150px]'>
              {resourceList.map((link) => (
                <NavigationMenuLink asChild key={link}>
                  <Link
                    href={`/resources/${link}`}
                    className='flex-row items-center justify-between'
                  >
                    {capitalize(link)}
                    {pathname.includes(link) && <Check className='size-4' />}
                  </Link>
                </NavigationMenuLink>
              ))}
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link
                href='/referral'
                className='flex flex-row items-center gap-2'
              >
                <LinkIcon />
                Referral
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link href='/bucket' className='flex flex-row items-center gap-2'>
                <Trash />
                S3 bucket
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link href='/email' className='flex flex-row items-center gap-2'>
                <Mail /> Email
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger>Admin</NavigationMenuTrigger>
            <NavigationMenuContent>
              {adminActionList.map((link) => (
                <Button
                  key={link}
                  variant='ghost'
                  onClick={() => {
                    setNewUserDialogOpen(!isNewUserDialogOpen)
                  }}
                >
                  {capitalize(link)}
                </Button>
              ))}
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <UserForm
        dialog
        isDialogOpen={isNewUserDialogOpen}
        setDialogOpen={setNewUserDialogOpen}
      />

      <Avatar />
    </header>
  )
}

export default Navbar
