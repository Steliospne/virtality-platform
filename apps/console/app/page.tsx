import Dashboard from '@/app/_components/dashboard'
import { cookies } from 'next/headers'

const env = process.env.ENV || 'development'

const HomePage = async () => {
  const cookieStore = await cookies()

  const cookie = cookieStore.get(
    env === 'production' || env === 'preview'
      ? '__Secure-virtality_admin_session'
      : 'virtality_admin_session',
  )

  return <Dashboard isImpersonating={!!cookie} />
}

export default HomePage
