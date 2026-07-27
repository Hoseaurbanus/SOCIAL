import { cn } from '@/lib/utils'
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-bg-tertiary', className)} />
}
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return <div className="space-y-2">{Array.from({ length: lines }).map((_, i) => <Skeleton key={i} className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')} />)}</div>
}
export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return <Skeleton className={cn('rounded-full', size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-16 w-16' : 'h-10 w-10')} />
}
