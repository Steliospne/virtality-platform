import type { ReactNode } from 'react'

const BucketLayout = ({
  children,
  modal,
}: {
  children: ReactNode
  modal: ReactNode
}) => {
  return (
    <>
      {children}
      {modal}
    </>
  )
}

export default BucketLayout
