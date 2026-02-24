'use client';
import { useLayoutEffect, useState } from 'react';
import TabBar, { LinkObject } from './TabBar';
import { Contact, FileX, Globe2, User } from 'lucide-react';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useLayoutEffect(() => {
    const handleWindowResize = () => {
      const isLarge = window.innerWidth > 1024;
      if (isLarge) {
        setIsOpen(true);
        setIsLargeScreen(true);
      } else {
        setIsOpen(false);
        setIsLargeScreen(false);
      }
    };

    // We call the function to get initial state fixes reload issue
    handleWindowResize();

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  const handleMouseEnter = () => {
    if (!isLargeScreen) setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (!isLargeScreen) setIsOpen(false);
  };

  const links: LinkObject = [
    {
      href: '/patients',
      ...(isOpen
        ? {
            icon: <User />,
            textContext: 'Patients',
            className:
              'text-zinc-200 flex rounded-md hover:text-zinc-200 hover:bg-emerald-600 dark:text-zinc-200 p-2 mx-1 gap-2',
          }
        : {
            icon: <User />,
            className:
              'flex justify-center p-2 mx-1 rounded-lg dark:text-zinc-200',
          }),
    },
    {
      href: '#',
      ...(isOpen
        ? {
            icon: <FileX />,
            textContext: 'Exercise',
            className:
              'text-zinc-200 flex rounded-md hover:text-zinc-200 hover:bg-emerald-600 dark:text-zinc-200 p-2 mx-1 gap-2',
          }
        : {
            icon: <FileX />,
            className:
              'flex justify-center p-2 mx-1 rounded-lg dark:text-zinc-200',
          }),
    },
    {
      href: '/services',
      ...(isOpen
        ? {
            icon: <Globe2 />,
            textContext: 'Services',
            className:
              'text-zinc-200 flex rounded-md hover:text-zinc-200 hover:bg-emerald-600 dark:text-zinc-200 p-2 mx-1 gap-2',
          }
        : {
            icon: <Globe2 />,
            className:
              'flex justify-center p-2 mx-1 rounded-lg dark:text-zinc-200',
          }),
    },
    {
      href: '#',
      ...(isOpen
        ? {
            icon: <Contact />,
            textContext: 'Contact',
            className:
              'text-zinc-200 flex rounded-md hover:text-zinc-200 hover:bg-emerald-600 dark:text-zinc-200 p-2 mx-1 gap-2',
          }
        : {
            icon: <Contact />,
            className:
              'flex justify-center p-2 mx-1 rounded-lg dark:text-zinc-200',
          }),
    },
  ];
  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className='fixed z-40 h-[calc(100svh-60px)] w-16 bg-zinc-200 shadow-lg hover:w-56 lg:w-56 dark:bg-zinc-900'
    >
      <aside className='h-full overflow-y-auto'>
        <nav className='h-full'>
          <TabBar linkObject={links} className='mx-2 flex flex-col gap-2' />
        </nav>
      </aside>
    </div>
  );
};

export default Sidebar;
