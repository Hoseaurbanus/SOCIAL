import { NavLink } from 'react-router'
import { Home, Compass, MessageCircle, Bell, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/discover', icon: Compass, label: 'Discover' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-header bg-bg-primary border-t border-border md:hidden" aria-label="Main navigation">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              'flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors min-w-[48px]',
              isActive ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
