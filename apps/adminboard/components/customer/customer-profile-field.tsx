import type { ReactNode } from 'react'

type CustomerProfileFieldProps = {
  label: string
  children: ReactNode
  valueClassName?: string
}

export function CustomerProfileField({
  label,
  children,
  valueClassName,
}: CustomerProfileFieldProps) {
  return (
    <div className='grid grid-cols-[7rem_1fr] gap-2'>
      <dt className='text-muted-foreground'>{label}</dt>
      <dd className={valueClassName}>{children}</dd>
    </div>
  )
}
