import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import type { ReactNode } from 'react'

// ===== Organic Animation Variants =====

export const organicVariants = {
  // Card entering the deck — staggered spring
  cardEnter: {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.08,
        type: 'spring' as const,
        stiffness: 260,
        damping: 24,
      },
    }),
    exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } },
  },

  // Story viewer — morph from card to full screen
  viewerEnter: {
    initial: { opacity: 0, scale: 0.8, borderRadius: '24px' },
    animate: {
      opacity: 1,
      scale: 1,
      borderRadius: '0px',
      transition: { type: 'spring' as const, stiffness: 200, damping: 26 },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      borderRadius: '24px',
      transition: { duration: 0.25, ease: [0.4, 0, 1, 1] as [number, number, number, number] },
    },
  },

  // Story content — slide in from right
  storySlide: {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0,
      scale: 0.9,
      transition: { duration: 0.25, ease: [0.4, 0, 1, 1] as [number, number, number, number] },
    }),
  },

  // Ripple effect on tap
  ripple: {
    tap: { scale: 0.95, transition: { type: 'spring' as const, stiffness: 400, damping: 17 } },
  },

  // Floating hover effect
  floatHover: {
    rest: { y: 0, transition: { type: 'spring' as const, stiffness: 200, damping: 20 } },
    hover: { y: -6, transition: { type: 'spring' as const, stiffness: 200, damping: 20 } },
  },

  // Bottom sheet / panel
  sheet: {
    hidden: { y: '100%', opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
    },
    exit: {
      y: '100%',
      opacity: 0,
      transition: { duration: 0.3, ease: [0.4, 0, 1, 1] as [number, number, number, number] },
    },
  },

  // Reaction pop
  reactionPop: {
    tap: {
      scale: [1, 1.4, 0.9, 1.1, 1],
      transition: { duration: 0.4, ease: 'easeOut' as const },
    },
  },

  // Progress bar fill
  progressFill: {
    animate: { scaleX: 1, transition: { duration: 5, ease: 'linear' as const } },
    paused: { scaleX: 1, transition: { duration: 0 } },
  },

  // Fade in up (general purpose)
  fadeInUp: {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
    },
  },

  // Scale in (for modals/overlays)
  scaleIn: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.15 },
    },
  },
}

// ===== Reusable Motion Components =====

interface MotionDivProps {
  children: ReactNode
  className?: string
  variant?: keyof typeof organicVariants
  custom?: number
  delay?: number
  onClick?: () => void
}

export function StoryCard({ children, className, custom = 0 }: MotionDivProps) {
  return (
    <motion.div
      className={className}
      variants={organicVariants.cardEnter}
      initial="hidden"
      animate="visible"
      exit="exit"
      custom={custom}
      whileHover="hover"
      whileTap="tap"
    >
      {children}
    </motion.div>
  )
}

export function StoryViewerOverlay({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={organicVariants.viewerEnter}
    >
      {children}
    </motion.div>
  )
}

export function StoryContent({ children, className, direction }: { children: ReactNode; className?: string; direction: number }) {
  return (
    <motion.div
      className={className}
      variants={organicVariants.storySlide}
      custom={direction}
      initial="enter"
      animate="center"
      exit="exit"
    >
      {children}
    </motion.div>
  )
}

export function RippleButton({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <motion.button
      className={className}
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.button>
  )
}

export function FloatingCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="rest"
      whileHover="hover"
      animate="rest"
      variants={organicVariants.floatHover}
    >
      {children}
    </motion.div>
  )
}

export function BottomSheet({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={organicVariants.sheet}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {children}
    </motion.div>
  )
}

export function ReactionButton({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <motion.button
      className={className}
      onClick={onClick}
      whileTap={{
        scale: [1, 1.5, 0.8, 1.2, 1],
        transition: { duration: 0.5 },
      }}
    >
      {children}
    </motion.button>
  )
}

// ===== Custom Hooks =====

export function useDragToDismiss(onDismiss: () => void) {
  const y = useMotionValue(0)
  const opacity = useTransform(y, [0, 200], [1, 0])
  const scale = useTransform(y, [0, 200], [1, 0.9])

  const handleDragEnd = (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onDismiss()
    }
  }

  return { y, opacity, scale, handleDragEnd }
}

export function useParallax() {
  const y = useMotionValue(0)
  const backgroundY = useTransform(y, [0, 500], [0, 150])
  const foregroundY = useTransform(y, [0, 500], [0, -50])

  return { y, backgroundY, foregroundY }
}

export function useSpringValue(target: number, stiffness = 260, damping = 20) {
  const value = useSpring(target, { stiffness, damping })
  return value
}

// ===== AnimatePresence Wrapper =====

export { AnimatePresence }
