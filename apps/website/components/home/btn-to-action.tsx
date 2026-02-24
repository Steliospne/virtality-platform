'use client'
import { Button } from '@/components/ui/button'
import { useRef, useEffect } from 'react'

const ButtonToAction = () => {
  const target = useRef<HTMLElement | null>(null)

  useEffect(() => {
    target.current = document.getElementById('cta')
  }, [])

  const handleScroll = () => target?.current?.scrollIntoView()

  return (
    <Button
      variant='link'
      onClick={handleScroll}
      className='text-white cursor-pointer text-sm p-0 h-auto underline underline-offset-2 hover:text-vital-blue-100 transition-colors font-semibold'
    >
      waitlist
    </Button>
  )
}

export default ButtonToAction
