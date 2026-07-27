import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center font-medium rounded-full',
  {
    variants: {
      variant: {
        primary: 'bg-accent-light text-accent-dark', success: 'bg-success-light text-success-dark',
        error: 'bg-error-light text-error-dark', warning: 'bg-warning-light text-warning-dark',
        info: 'bg-info-light text-info-dark', neutral: 'bg-bg-tertiary text-text-secondary',
      },
      size: { sm: 'px-2 py-0.5 text-xs', md: 'px-2.5 py-0.5 text-xs', lg: 'px-3 py-1 text-sm' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

interface BadgeProps extends VariantProps<typeof badgeVariants> { children: React.ReactNode; className?: string }
export function Badge({ children, variant, size, className }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size, className }))}>{children}</span>
}

interface CountBadgeProps { count: number; max?: number; className?: string }
export function CountBadge({ count, max = 99, className }: CountBadgeProps) {
  return <span className={cn('inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium rounded-full bg-accent text-text-inverse', className)}>{count > max ? `${max}+` : count}</span>
}
