import { NavLink, useLocation } from 'react-router'
import { Home, Compass, MessageCircle, Bell, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUnreadCount } from '@/hooks/use-notifications'
import { useUnreadMessageCount } from '@/hooks/use-messages'
import { useScrollDirection } from '@/hooks/use-scroll-direction'

const navItems = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/discover', icon: Compass, label: 'Discover' },
  { to: '/messages', icon: MessageCircle, label: 'Messages', showBadge: true },
  { to: '/notifications', icon: Bell, label: 'Alerts', showBadge: true },
  { to: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const { data: unreadCount = 0 } = useUnreadCount()
  const { data: unreadMessages = 0 } = useUnreadMessageCount()
  const { direction, scrollY } = useScrollDirection(10)
  const location = useLocation()

  const isHidden = direction === 'down' && scrollY > 100

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-header md:hidden',
        'bg-bg-primary/95 backdrop-blur-xl',
        'border-t border-border',
        'transition-all duration-300 ease-out',
        isHidden ? 'translate-y-full' : 'translate-y-0'
      )}
      aria-label="Main navigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to ||
            (item.to === '/messages' && location.pathname.startsWith('/messages'))
          const badgeCount = item.to === '/notifications' ? unreadCount :
            item.to === '/messages' ? unreadMessages : 0
          const showBadge = item.showBadge && badgeCount > 0

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="relative flex flex-col items-center justify-center min-w-[56px] h-full py-2"
            >
              <div className="relative flex flex-col items-center gap-1">
                  {/* Active indicator pill */}
                  <div
                    className={cn(
                      'absolute -top-1 left-1/2 -translate-x-1/2 h-6 rounded-full transition-all duration-300 ease-out',
                      isActive ? 'w-8 bg-accent opacity-100' : 'w-0 bg-transparent opacity-0'
                    )}
                  />

                  {/* Icon container */}
                  <div
                    className={cn(
                      'relative p-2 rounded-2xl transition-all duration-200',
                      isActive
                        ? 'text-white'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary active:scale-90'
                    )}
                  >
                    <item.icon className={cn('h-5 w-5 transition-transform duration-200', isActive && 'scale-110')} />

                    {/* Badge */}
                    {showBadge && (
                      <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-secondary text-white shadow-lg shadow-secondary/30">
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={cn(
                      'text-[10px] font-semibold transition-all duration-200',
                      isActive ? 'text-accent' : 'text-text-tertiary'
                    )}
                  >
                    {item.label}
                  </span>
                </div>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
