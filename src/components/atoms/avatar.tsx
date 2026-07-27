import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const avatarVariants = cva(
  'relative inline-flex items-center justify-center rounded-full bg-accent-light text-accent font-semibold overflow-hidden',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs', sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base', xl: 'h-24 w-24 text-2xl', '2xl': 'h-32 w-32 text-3xl',
      },
    },
    defaultVariants: { size: 'md' },
  }
)

type StatusType = 'online' | 'offline' | 'away' | 'dnd'

interface AvatarProps extends VariantProps<typeof avatarVariants> {
  src?: string; alt?: string; initials?: string; status?: StatusType; className?: string
}

export function Avatar({ src, alt, initials, size, status, className }: AvatarProps) {
  const initialsText = initials || alt?.slice(0, 2).toUpperCase() || '?'
  const statusColors: Record<StatusType, string> = {
    online: 'bg-success', offline: 'bg-text-tertiary', away: 'bg-warning', dnd: 'bg-error',
  }
  return (
    <div className={cn('relative', className)}>
      <div className={cn(avatarVariants({ size }))}>
        {src ? <img src={src} alt={alt} className="h-full w-full object-cover" /> : <span>{initialsText}</span>}
      </div>
      {status && (
        <span className={cn('absolute bottom-0 right-0 rounded-full border-2 border-bg-primary', statusColors[status], size === 'xs' || size === 'sm' ? 'h-2 w-2' : 'h-3 w-3')} />
      )}
    </div>
  )
}
