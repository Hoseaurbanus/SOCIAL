import { Download, X } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { usePwaInstall } from '@/hooks/use-pwa-install'
import { useState, useEffect } from 'react'

export function PwaInstallBanner() {
  const { canInstall, isInstalled, isIOS, install, dismiss, wasRecentlyDismissed } = usePwaInstall()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isInstalled) return
    if (wasRecentlyDismissed()) return

    if (canInstall) {
      const timer = setTimeout(() => setVisible(true), 3000)
      return () => clearTimeout(timer)
    }

    if (isIOS) {
      const timer = setTimeout(() => setVisible(true), 5000)
      return () => clearTimeout(timer)
    }
  }, [canInstall, isInstalled, isIOS, wasRecentlyDismissed])

  if (isInstalled || !visible) return null

  const handleInstall = async () => {
    if (isIOS) return
    const success = await install()
    if (success) setVisible(false)
  }

  const handleDismiss = () => {
    dismiss()
    setVisible(false)
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 z-fab md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-bg-primary border border-border rounded-2xl shadow-xl p-4 flex items-center gap-3 animate-slide-up">
        <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
          <Download className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">Install S.S</p>
          <p className="text-xs text-text-secondary">
            {isIOS
              ? 'Tap Share → Add to Home Screen'
              : 'Add to your home screen for the best experience'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isIOS && canInstall && (
            <Button size="sm" onClick={handleInstall} className="text-xs">
              Install
            </Button>
          )}
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-full hover:bg-bg-tertiary text-text-tertiary transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
