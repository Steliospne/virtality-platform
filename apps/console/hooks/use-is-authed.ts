import { usePathname, useRouter } from 'next/navigation'
import { authClient } from '@/auth-client'
import { useEffect } from 'react'

const PUBLIC_PATHS = [
  '/sign-in',
  '/sign-up',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/goodbye',
  '/auth',
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
