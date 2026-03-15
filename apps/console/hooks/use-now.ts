import { useEffect, useRef } from 'react'

function useNow() {
  const ts = useRef(0)

  useEffect(() => {
    ts.current = Date.now()
  }, [])

  const now = () => {
    return Date.now()
  }

  const setNow = (value: number) => {
    ts.current = value
  }

  return { ts, now, setNow }
}

export default useNow
