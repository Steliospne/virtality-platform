'use client'
import placeholder from '@/public/placeholder.svg'
import Image from 'next/image'
import { authClient } from '@/auth-client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Check,
  Home,
  Languages,
  LogOut,
  Moon,
  Settings,
  Sun,
  User as UserIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useTour } from '@/context/tour-context'
import { FlagKeys, flagMap, settings } from '@/i18n/settings'
import capitalize from 'lodash.capitalize'
import { useClientT } from '@/i18n/use-client-t'
import AvatarSkeleton from './avatar-skeleton'
import useMounted from '@/hooks/use-mounted'
import { useStore } from 'tinybase/ui-react'
import { useRouter } from 'next/navigation'

const Avatar = () => {
  const websiteDomain = process.env.NEXT_PUBLIC_WEBSITE_URL
  const router = useRouter()
  const mounted = useMounted()
  const { setTheme, resolvedTheme, theme, themes } = useTheme()
  const { state, setState } = useTour()
  const { t, i18n } = useClientT(['avatar', 'glossary'])
  const { data, isPending } = authClient.useSession()
  const store = useStore()
  const handleSignOut = async () =>
    await authClient.signOut({
      fetchOptions: { onSuccess: () => router.push('/sign-in') },
    })

  const user = data?.user

  if (isPending) return <AvatarSkeleton />

  return (
    <DropdownMenu
      open={state.isDropdownOpen}
      onOpenChange={(value) => {
        if (state.activeTour) return
        setState({ ...state, isDropdownOpen: value })
      }}
    >
      {mounted && (
        <DropdownMenuTrigger
          id='avatar'
          className='flex cursor-pointer justify-center gap-2'
        >
          <div className='m-auto max-lg:text-sm'>
            <span className='underline-effect'>{`${user?.name}`}</span>
          </div>
          <div className='size-12 items-center overflow-hidden rounded-full border-2 border-black hover:scale-105 dark:border-white'>
            <Image
              alt='User avatar.'
              src={user?.image ? user.image : placeholder}
              width={50}
              height={50}
            />
          </div>
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent
        id='dropdown-menu'
        className='w-56 rounded-t-none dark:border-zinc-600 dark:bg-zinc-950'
        align='end'
        alignOffset={-9}
        sideOffset={6}
      >
        <DropdownMenuLabel></DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className='cursor-pointer'>
            <Link href={websiteDomain ?? '#'} className='flex w-full'>
              <Home />
              {t('home_page')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            id='user-profile'
            asChild
            className='cursor-pointer'
          >
            <Link href={`/user/${user?.id}/profile`} className='flex w-full'>
              <UserIcon />
              {t('profile', { ns: 'glossary' })}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className='gap-2'>
              <Settings className='text-muted-foreground size-4' />
              <span> {t('settings', { ns: 'glossary' })}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className='dark:bg-zinc-950'>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => {
                      store?.setCell(
                        'users',
                        user!.id,
                        'dashboardSuggestionSidebar',
                        true,
                      )
                      store?.setCell(
                        'users',
                        user!.id,
                        'dashboardSuggestionDropdown',
                        true,
                      )
                    }}
                  >
                    Reset Suggestions
                  </DropdownMenuItem>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className='gap-2'>
                      {resolvedTheme === 'light' ? (
                        <Moon className='text-muted-foreground size-4' />
                      ) : (
                        <Sun className='text-muted-foreground size-4' />
                      )}
                      Theme
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className='dark:bg-zinc-950'>
                      {themes.map((th) => (
                        <DropdownMenuItem
                          key={th}
                          onClick={() => setTheme(th)}
                          className='cursor-pointer'
                        >
                          {capitalize(th)}
                          {theme === th && <Check />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className='gap-2'>
                      <Languages className='text-muted-foreground size-4' />
                      {t('language', { ns: 'glossary' })}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {settings.languages.map((lang) => {
                        const Flag = flagMap[lang as FlagKeys]
                        return (
                          <DropdownMenuItem
                            key={lang}
                            disabled={i18n.resolvedLanguage === lang}
                            onClick={() => {
                              i18n.changeLanguage(lang)
                            }}
                            className='flex cursor-pointer items-center'
                          >
                            <Flag className='size-4' />
                            {lang.toUpperCase()}
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem asChild className='cursor-pointer'>
            <span onClick={handleSignOut} className='flex gap-2'>
              <LogOut />
              {t('logout', { ns: 'glossary' })}
            </span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
export default Avatar
