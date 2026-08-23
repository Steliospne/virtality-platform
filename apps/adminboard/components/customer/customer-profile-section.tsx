import type { ReactNode } from 'react'

type CustomerProfileSectionProps = {
  title: string
  children: ReactNode
}

export function CustomerProfileSection({
  title,
  children,
}: CustomerProfileSectionProps) {
  return (
    <section className='grid gap-3'>
      <h3 className='text-lg font-semibold'>{title}</h3>
      <dl className='grid gap-2 text-sm'>{children}</dl>
    </section>
  )
}
