'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function useNavigationGuard(
  shouldPrevent: boolean,
  cb?: () => void,
) {
  const router = useRouter()
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (shouldPrevent) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [shouldPrevent])

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // ignore right-clicks or modifier clicks
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return

      const target = e.target as HTMLElement | null
      if (!target) return

      const anchor =
        target.closest && (target.closest('a') as HTMLAnchorElement | null)
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      const targetAttr = anchor.getAttribute('target')
      if (targetAttr && targetAttr !== '_self') return

      if (href.startsWith('mailto:') || href.startsWith('tel:')) return

      let isInternal = false
      try {
        const url = new URL(href, window.location.href)
        isInternal = url.origin === window.location.origin
      } catch {
        return
      }
      if (!isInternal) return

      if (shouldPrevent) {
        e.preventDefault()
        if (e.stopImmediatePropagation) e.stopImmediatePropagation()
        setPendingHref(href)
        setOpen(true)
      }
    }

    document.addEventListener('click', handleDocumentClick, true)
    return () =>
      document.removeEventListener('click', handleDocumentClick, true)
  }, [shouldPrevent])

  const confirmLeave = () => {
    if (cb) cb()

    const href = pendingHref
    setOpen(false)
    setPendingHref(null)
    if (!href) return
    if (href.startsWith('#')) {
      window.location.hash = href
      return
    }
    router.push(href)
  }

  const cancelLeave = () => {
    setOpen(false)
    setPendingHref(null)
  }

  const GuardDialog = ({
    title,
    description,
  }: {
    title: string
    description: string
  }) => (
    <Dialog open={open} onOpenChange={(o) => setOpen(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='primary' onClick={cancelLeave}>
            Stay
          </Button>
          <Button variant='destructive' onClick={confirmLeave}>
            Leave
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return { GuardDialog, confirmLeave, cancelLeave, isOpen: open }
}
