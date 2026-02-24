import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

type Props = { children?: ReactNode; className?: string }

export const H1 = ({ children, className }: Props) => {
  return <h1 className={cn('text-h1', className)}>{children}</h1>
}

export const H2 = ({ children, className }: Props) => {
  return <h2 className={cn('text-h2', className)}>{children}</h2>
}

export const H3 = ({ children, className }: Props) => {
  return <h3 className={cn('text-h3', className)}>{children}</h3>
}

export const H4 = ({ children, className }: Props) => {
  return <h4 className={cn('text-h4', className)}>{children}</h4>
}

export const P = ({ children, className }: Props) => {
  return <p className={cn('text-body', className)}>{children}</p>
}
