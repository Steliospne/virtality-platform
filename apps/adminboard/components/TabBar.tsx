'use client';

import { cn } from '@/lib/utils';
import Link, { LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import { HTMLAttributes, ReactNode } from 'react';

type TabBarProps = {
  linkObject?: LinkObject;
  className?: HTMLAttributes<HTMLDivElement>['className'];
};

export type LinkObject = (LinkProps & {
  textContext?: string;
  icon?: ReactNode;
  className?: HTMLAttributes<HTMLInputElement>['className'];
})[];

const TabBar = ({ linkObject, className }: TabBarProps) => {
  const pathname = usePathname();
  const links = linkObject ? linkObject : null;

  return (
    <div className='sticky top-[60px] z-30'>
      <ul
        className={cn(
          className
            ? className
            : 'flex w-full gap-2 bg-zinc-100 p-2 dark:bg-zinc-700',
        )}
      >
        {links &&
          links.map((link, i) => (
            <li key={i}>
              <Link
                href={link.href}
                className={cn(
                  pathname === link.href
                    ? 'bg-emerald-500 text-zinc-200'
                    : 'text-zinc-900',
                  link.className
                    ? link.className
                    : 'flex rounded-md px-2 py-1 hover:bg-emerald-600 hover:text-zinc-200 dark:text-zinc-200',
                )}
              >
                <div>{link.icon && link.icon}</div>
                {link.textContext}
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default TabBar;
