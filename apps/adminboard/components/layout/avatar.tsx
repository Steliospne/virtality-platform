'use client';
import placeholder from '@/public/placeholder.svg';
import Image from 'next/image';
import { authClient } from '@/auth-client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Check,
  Home,
  LogOut,
  Moon,
  Settings,
  Sun,
  User as UserIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import capitalize from 'lodash.capitalize';
import AvatarSkeleton from './avatar-skeleton';
import useMounted from '@/hooks/use-mounted';
import { useRouter } from 'next/navigation';

interface AvatarProps {
  websiteDomain?: string;
}
const Avatar = ({ websiteDomain }: AvatarProps) => {
  const mounted = useMounted();
  const { setTheme, resolvedTheme, theme, themes } = useTheme();
  const { data, isPending } = authClient.useSession();
  const router = useRouter();

  const handleSignOut = async () =>
    await authClient.signOut({
      fetchOptions: { onSuccess: () => router.push('/log-in') },
    });

  const user = data?.user;

  if (isPending) return <AvatarSkeleton />;

  return (
    <DropdownMenu>
      {mounted && (
        <DropdownMenuTrigger
          id='avatar'
          className='ml-auto flex cursor-pointer justify-center gap-2'
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
      >
        <DropdownMenuLabel></DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className='cursor-pointer'>
            <Link href={websiteDomain ?? '#'} className='flex w-full'>
              <Home />
              Home Page
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            id='user-profile'
            asChild
            className='cursor-pointer'
          >
            <Link href={`/user/${user?.id}/profile`} className='flex w-full'>
              <UserIcon />
              Profile
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className='gap-2'>
              <Settings className='text-muted-foreground size-4' />
              <span>Settings</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className='dark:bg-zinc-950'>
                <DropdownMenuGroup>
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
                </DropdownMenuGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem asChild className='cursor-pointer'>
            <span onClick={handleSignOut} className='flex gap-2'>
              <LogOut />
              Logout
            </span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default Avatar;
