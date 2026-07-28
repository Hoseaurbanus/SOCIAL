import { NavLink } from 'react-router'
import { Home, Compass, MessageCircle, Bell, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUnreadCount } from '@/hooks/use-notifications'

const navItems = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/discover', icon: Compass, label: 'Discover' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const { data: unreadCount = 0 } = useUnreadCount()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-header bg-bg-primary/95 backdrop-blur-lg border-t border-border md:hidden" aria-label="Main navigation">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              'relative flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-all duration-200 min-w-[56px] rounded-2xl',
              isActive
                ? 'text-accent bg-accent-light'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.to === '/notifications' && unreadCount > 0 && (
              <span className="absolute -top-0.5 right-1 h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-secondary text-white shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
