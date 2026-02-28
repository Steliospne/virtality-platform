'use server'
import { headers } from 'next/headers'
import { User, Session } from '@virtality/db'
import {
  API_PREFIX,
  SERVER_URL,
  SERVER_URL_LOCAL,
} from '@virtality/shared/types'

const me =
  `${process.env.NODE_ENV === 'production' ? SERVER_URL : SERVER_URL_LOCAL}` +
  API_PREFIX +
  '/rpc/me'

const fetchOptions: RequestInit = {
  credentials: 'include',
  cache: 'no-store',
}

console.log('me URL: ', me)

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

export const getUserAndSession = async () => {
  try {
    const data = await fetchUserSession()

    return data
  } catch (error) {
    console.log(error)
    throw Error('[Better Auth] Problem with getting User and Session!')
  }
}
