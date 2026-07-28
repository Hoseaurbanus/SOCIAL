import { useState, useEffect, useCallback, useRef } from 'react'

interface ScrollDirection {
  direction: 'up' | 'down' | null
  isAtTop: boolean
  scrollY: number
}

export function useScrollDirection(threshold = 10) {
  const [scrollState, setScrollState] = useState<ScrollDirection>({
    direction: null,
    isAtTop: true,
    scrollY: 0,
  })
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  const updateScrollState = useCallback(() => {
    const scrollY = window.scrollY
    const diff = scrollY - lastScrollY.current

    if (Math.abs(diff) < threshold) {
      ticking.current = false
      return
    }

    const direction = diff > 0 ? 'down' : 'up'
    const isAtTop = scrollY < 10

    setScrollState({ direction, isAtTop, scrollY })
    lastScrollY.current = scrollY
    ticking.current = false
  }, [threshold])

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(updateScrollState)
        ticking.current = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [updateScrollState])

  return scrollState
}
