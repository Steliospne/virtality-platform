'use client'

import { Button } from '@virtality/ui/components/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { H2, H3, P } from '@/components/ui/typography'
import { ReactNode } from 'react'
import Instructions from './instructions.mdx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@virtality/ui/components/table'

export function HelpDialog({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='flex h-9/10 max-w-3/5! flex-col max-xl:max-w-9/10!'>
        <DialogHeader>
          <DialogTitle></DialogTitle>
        </DialogHeader>
        <div className='flex-1 space-y-3 overflow-auto'>
          <Instructions
            components={{
              h2: H2,
              h3: H3,
              p: P,
              ul: ({ children }: { children: ReactNode }) => (
                <ul className='[&_li]:list-inside [&_li]:list-disc'>
                  {children}
                </ul>
              ),
              ol: ({ children }: { children: ReactNode }) => (
                <ol className='[&_li]:list-inside [&_li]:list-decimal'>
                  {children}
                </ol>
              ),
              table: ({ children }: { children: ReactNode }) => (
                <Table>{children}</Table>
              ),
              thead: ({ children }: { children: ReactNode }) => (
                <TableHeader>{children}</TableHeader>
              ),
              tbody: ({ children }: { children: ReactNode }) => (
                <TableBody>{children}</TableBody>
              ),
              th: ({ children }: { children: ReactNode }) => (
                <TableHead>{children}</TableHead>
              ),
              tr: ({ children }: { children: ReactNode }) => (
                <TableRow>{children}</TableRow>
              ),
              td: ({ children }: { children: ReactNode }) => (
                <TableCell>{children}</TableCell>
              ),
            }}
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
