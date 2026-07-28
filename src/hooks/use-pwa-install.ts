import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null

export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(ios)

    const standalone = window.matchMedia('(display-mode: standalone)').matches
    const iosStandalone = (window.navigator as any).standalone === true
    setIsInstalled(standalone || iosStandalone)

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e as BeforeInstallPromptEvent
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return false
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    deferredPrompt = null
    setCanInstall(false)
    return outcome === 'accepted'
  }, [])

  const dismiss = useCallback(() => {
    setCanInstall(false)
    try {
      sessionStorage.setItem('pwa-install-dismissed', Date.now().toString())
    } catch {}
  }, [])

  const wasRecentlyDismissed = useCallback(() => {
    try {
      const dismissed = sessionStorage.getItem('pwa-install-dismissed')
      if (!dismissed) return false
      const elapsed = Date.now() - parseInt(dismissed, 10)
      return elapsed < 24 * 60 * 60 * 1000 // 24 hours
    } catch {
      return false
    }
  }, [])

  return { canInstall, isInstalled, isIOS, install, dismiss, wasRecentlyDismissed }
}
