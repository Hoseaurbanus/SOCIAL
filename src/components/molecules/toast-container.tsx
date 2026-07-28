import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const variantConfig = {
  success: {
    icon: CheckCircle,
    containerClass: 'bg-success/10 border-success/20 text-success',
    iconClass: 'text-success',
  },
  error: {
    icon: XCircle,
    containerClass: 'bg-error/10 border-error/20 text-error',
    iconClass: 'text-error',
  },
  info: {
    icon: Info,
    containerClass: 'bg-accent/10 border-accent/20 text-accent',
    iconClass: 'text-accent',
  },
}

export function ToastContainer() {
  const toasts = useToast((s) => s.toasts)
  const dismiss = useToast((s) => s.dismiss)

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => {
        const config = variantConfig[t.variant]
        const Icon = config.icon
        return (
          <div
            key={t.id}
            className={cn(
              'animate-slide-up flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[280px] max-w-[400px]',
              config.containerClass
            )}
          >
            <Icon className={cn('h-5 w-5 flex-shrink-0', config.iconClass)} />
            <span className="flex-1 text-sm font-medium">{t.title}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="p-0.5 rounded-full hover:bg-black/10 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
