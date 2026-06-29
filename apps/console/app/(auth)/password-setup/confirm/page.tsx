import ConfirmForm from './confirm-form'

const PasswordSetupConfirmPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) => {
  const { token } = await searchParams

  return (
    <section className='h-screen-with-header flex flex-col items-center justify-center'>
      <ConfirmForm token={token} />
    </section>
  )
}

export default PasswordSetupConfirmPage
