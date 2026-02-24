import ResetForm from './reset-form'

const ResetPasswordPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) => {
  const { token } = await searchParams

  return (
    <section className='h-screen-with-header flex flex-col items-center justify-center'>
      <ResetForm token={token} />
    </section>
  )
}

export default ResetPasswordPage
