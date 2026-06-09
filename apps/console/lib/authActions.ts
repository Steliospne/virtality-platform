'use server'

import { Session, User } from '@/auth-client'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ORPC_PREFIX, getServerUrl } from '@virtality/shared/types'
import { serverLogger } from './server-logger'

const logger = serverLogger.child({
  component: 'console-auth-actions',
})

const baseURL = getServerUrl()

const me = baseURL + ORPC_PREFIX + '/me'

const fetchOptions: RequestInit = {
  credentials: 'include',
  cache: 'no-store',
}

const fetchUserSession = async () => {
  try {
    const headerStore = await headers()
    const cookie = headerStore.get('cookie') ?? undefined

    if (!cookie) return null

    const res = await fetch(me, {
      ...fetchOptions,
      headers: { cookie },
    })

    if (!res.ok) return null

    const body = await res.json()
    // tRPC response shape: { result: { data: { json: <value> } } }
    const data = (body?.json ?? body) as {
      session: Session
      user: User
    }

    if (!data?.session || !data?.user) return null
    return data
  } catch (error) {
    logger.error(
      'console.auth.fetch_session.failed',
      {
        error,
        baseURL,
      },
      'Failed to fetch user session',
    )
  }
}

export const getUser = async () => {
  try {
    const data = await fetchUserSession()

    return data?.user
  } catch (error) {
    logger.error(
      'console.auth.get_user.failed',
      {
        error,
      },
      'Failed to load user',
    )
  }
}

export const getUserAndSession = async () => {
  try {
    const data = await fetchUserSession()

    return data
  } catch (error) {
    logger.error(
      'console.auth.get_user_and_session.failed',
      {
        error,
      },
      'Failed to load user and session',
    )
    throw Error('[Better Auth] Problem with getting User and Session!')
  }
}

export const hasActiveSession = async () => {
  const data = await fetchUserSession()
  if (!data) redirect('/sign-in')
}
