export const FormErrors = ({
  children,
  className,
}: {
  children: string | string[]
  className?: string
}) => {
  if (Array.isArray(children))
    return children.map((error, index) => (
      <p key={index} className={className}>
        <i className='text-red-500'>{error}</i>
      </p>
    ))
  return (
    <p className={className}>
      <i className='text-red-500'>{children}</i>
    </p>
  )
}
