'use server'

import { Session, User } from '@/auth-client'
import { ORPC_PREFIX } from '@virtality/orpc'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

const me = process.env.SERVER_URL + ORPC_PREFIX + '/me'

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
    console.log(error)
  }
}

export const getUser = async () => {
  try {
    const data = await fetchUserSession()

    return data?.user
  } catch (error) {
    console.log(error)
  }
}

export const getUserAndSession = async () => {
  try {
    const data = await fetchUserSession()

    return data
  } catch (error) {
    console.log(error)
    throw Error('[Better Auth] Problem with getting User and Session!')
  }
}

export const hasActiveSession = async () => {
  const data = await fetchUserSession()
  if (!data) redirect('/sign-in')
}
