import { motion, type MotionProps } from 'framer-motion'
import { forwardRef } from 'react'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

const slideIn = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
}

interface PageTransitionProps extends MotionProps {
  children: React.ReactNode
  variant?: 'fadeUp' | 'fadeIn' | 'scaleIn' | 'slideIn'
  className?: string
}

export const PageTransition = forwardRef<HTMLDivElement, PageTransitionProps>(
  ({ children, variant = 'fadeUp', className, ...props }, ref) => {
    const variants = { fadeUp, fadeIn, scaleIn, slideIn }[variant]
    return (
      <motion.div
        ref={ref}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
PageTransition.displayName = 'PageTransition'

export const FadeIn = motion.div
export const ScaleIn = motion.div
export const SlideIn = motion.div
