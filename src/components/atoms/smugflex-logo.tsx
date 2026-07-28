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
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="smugflex-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0D9488" />
          <stop offset="40%" stopColor="#0F766E" />
          <stop offset="100%" stopColor="#115E59" />
        </linearGradient>
        <linearGradient id="smugflex-accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5EEAD4" />
          <stop offset="100%" stopColor="#2DD4BF" />
        </linearGradient>
        <linearGradient id="smugflex-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>

      {/* Outer rounded square — modern app icon shape */}
      <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#smugflex-grad)" />

      {/* Abstract S+F monogram — geometric, modern, bold */}
      {/* S shape — top left to bottom right flow */}
      <path
        d="M20 18 C20 14 24 12 28 12 L36 12 C40 12 42 14 42 17 C42 20 38 22 34 24 L28 26 C24 28 22 30 22 33 C22 36 24 38 28 38 L36 38 C40 38 42 40 42 44"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.95"
      />

      {/* F crossbar — subtle accent element */}
      <path
        d="M44 24 L50 24"
        stroke="url(#smugflex-gold)"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Accent dot — brand mark */}
      <circle cx="50" cy="18" r="3" fill="url(#smugflex-gold)" opacity="0.9" />
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
        <span className={cn('font-black tracking-tight text-text-primary', s.text)}>
          SMUG<span className="text-accent">FLEX</span>
        </span>
      )}
      {variant === 'wordmark' && (
        <span className={cn('font-black tracking-tight text-text-primary', s.text)}>
          SMUGFLEX
        </span>
      )}
    </div>
  )
}
