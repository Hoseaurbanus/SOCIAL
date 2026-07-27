import { useEffect } from 'react'
import { useUIStore } from '@/stores/ui-store'

export function useTheme() {
  const { theme, setTheme } = useUIStore()
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (theme === 'system') {
        document.documentElement.setAttribute('data-theme', mq.matches ? 'dark' : 'light')
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])
  return { theme, setTheme }
}
