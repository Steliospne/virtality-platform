import Dashboard from '@/app/(pages)/user/user-dashboard/dashboard'
import { cookies } from 'next/headers'

const env = process.env.ENV || 'development'

const HomePage = async () => {
  const cookieStore = await cookies()

  const cookie = cookieStore.get(
    env === 'production' || env === 'preview'
      ? '__Secure-virtality_admin_session'
      : 'virtality_admin_session_local',
  )

  return <Dashboard isImpersonating={!!cookie} />
}

export default HomePage
