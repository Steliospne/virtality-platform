import { usePathname, useRouter } from 'next/navigation'
import { authClient } from '@/auth-client'
import { useEffect } from 'react'

/** Routes that may render without a session (must include `/error` — it lives under `(app)` and still mounts Navbar → useIsAuthed). */
export const PUBLIC_PATHS = [
  '/sign-in',
  '/sign-up',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/password-setup',
  '/goodbye',
  '/auth',
  '/error',
]

const useIsAuthed = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { data, isPending } = authClient.useSession()

  useEffect(() => {
    if (isPending || data) return
    const isPublicPath = PUBLIC_PATHS.some(
      (p) => pathname === p || pathname?.startsWith(p + '/'),
    )
    if (!isPublicPath) {
      router.push('/sign-in')
    }
  }, [isPending, data, router, pathname])

  return { data, isPending }
}

export default useIsAuthed
