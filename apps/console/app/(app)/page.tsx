import Dashboard from './_components/dashboard'
import { cookies } from 'next/headers'

const env = process.env.ENV ?? process.env.NEXT_PUBLIC_ENV ?? 'development'
const authCookieNameSuffix = env === 'preview' ? '_preview' : ''
const adminSessionCookieName = `virtality${authCookieNameSuffix}_admin_session`

const HomePage = async () => {
  const cookieStore = await cookies()

  const cookie = cookieStore.get(
    env === 'production' || env === 'preview'
      ? `__Secure-${adminSessionCookieName}`
      : adminSessionCookieName,
  )

  return <Dashboard isImpersonating={!!cookie} />
}

export default HomePage
