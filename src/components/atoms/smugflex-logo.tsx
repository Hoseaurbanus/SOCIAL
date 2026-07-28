import { cn } from '@/lib/utils'

interface SmugflexLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'icon' | 'wordmark' | 'full'
  className?: string
}

const sizes = {
  sm: { icon: 32, text: 'text-lg', gap: 'gap-2' },
  md: { icon: 40, text: 'text-xl', gap: 'gap-2.5' },
  lg: { icon: 48, text: 'text-2xl', gap: 'gap-3' },
  xl: { icon: 64, text: 'text-3xl', gap: 'gap-4' },
}

function LogoIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Abstract flowing connection mark */}
      <defs>
        <linearGradient id="smugflex-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0D9488" />
          <stop offset="50%" stopColor="#0F766E" />
          <stop offset="100%" stopColor="#115E59" />
        </linearGradient>
        <linearGradient id="smugflex-accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5EEAD4" />
          <stop offset="100%" stopColor="#2DD4BF" />
        </linearGradient>
      </defs>
      {/* Primary shape - flowing S-like form */}
      <path
        d="M12 8C12 8 8 12 8 18C8 24 14 26 18 28C22 30 28 32 28 38C28 44 22 44 18 44"
        stroke="url(#smugflex-gradient)"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Secondary shape - complementary flow */}
      <path
        d="M36 40C36 40 40 36 40 30C40 24 34 22 30 20C26 18 20 16 20 10C20 4 26 4 30 4"
        stroke="url(#smugflex-accent)"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Connection dot */}
      <circle cx="24" cy="24" r="3" fill="url(#smugflex-gradient)" />
    </svg>
  )
}

export function SmugflexLogo({ size = 'md', variant = 'full', className }: SmugflexLogoProps) {
  const s = sizes[size]

  if (variant === 'icon') {
    return <LogoIcon size={s.icon} />
  }

  return (
    <div className={cn('flex items-center', s.gap, className)}>
      <LogoIcon size={s.icon} />
      {variant === 'full' && (
        <span className={cn('font-bold tracking-tight text-text-primary', s.text)}>
          SMUG<span className="text-accent">FLEX</span>
        </span>
      )}
      {variant === 'wordmark' && (
        <span className={cn('font-bold tracking-tight text-text-primary', s.text)}>
          SMUGFLEX
        </span>
      )}
    </div>
  )
}
