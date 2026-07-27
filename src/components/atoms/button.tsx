import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-all rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-text-inverse hover:bg-accent-hover active:bg-accent-active shadow-sm hover:shadow-md',
        secondary: 'bg-transparent border border-border text-text-primary hover:bg-bg-tertiary active:bg-bg-secondary',
        ghost: 'bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary active:bg-bg-secondary',
        danger: 'bg-error text-white hover:bg-error-hover active:bg-error-dark shadow-sm',
        success: 'bg-success text-white hover:bg-success-hover active:bg-success-dark shadow-sm',
      },
      size: {
        xs: 'h-7 px-2 text-xs rounded-sm',
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-lg',
      },
      fullWidth: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading, icon, iconPosition = 'left', children, disabled, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, fullWidth, className }))} ref={ref} disabled={disabled || loading} {...props}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon && iconPosition === 'left' ? icon : null}
      {children}
      {!loading && icon && iconPosition === 'right' ? icon : null}
    </button>
  )
)
Button.displayName = 'Button'
