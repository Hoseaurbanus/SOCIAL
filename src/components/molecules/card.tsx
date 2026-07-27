import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva('rounded-lg border border-border bg-bg-primary', {
  variants: {
    padding: { none: 'p-0', sm: 'p-3', md: 'p-4', lg: 'p-6' },
    hover: { true: 'transition-shadow duration-fast hover:shadow-md' },
  },
  defaultVariants: { padding: 'md' },
})

interface CardProps extends VariantProps<typeof cardVariants> {
  children: React.ReactNode; className?: string; onClick?: () => void
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, padding, hover, className, onClick, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ padding, hover, className }))} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined} {...props}>
      {children}
    </div>
  )
)
Card.displayName = 'Card'

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-4', className)}>{children}</div>
}
export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-lg font-semibold text-text-primary', className)}>{children}</h3>
}
export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn(className)}>{children}</div>
}
export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mt-4 flex items-center', className)}>{children}</div>
}
