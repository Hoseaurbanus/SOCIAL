import { Link } from 'react-router'
import { Search, Bell, MessageCircle } from 'lucide-react'

interface HeaderProps {
  notificationCount?: number
}

export function Header({ notificationCount = 0 }: HeaderProps) {
  return (
    <header className="sticky top-0 z-header bg-bg-primary border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 max-w-[1200px] mx-auto">
        <Link to="/home" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-sm font-bold text-text-inverse">S</span>
          </div>
          <span className="text-lg font-bold text-text-primary hidden sm:block">SMUGFLEX</span>
        </Link>

        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search communities, people..."
              className="w-full h-9 pl-10 pr-4 rounded-lg border border-border bg-bg-secondary text-text-primary text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
              aria-label="Search"
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Link
            to="/notifications"
            className="relative p-2 rounded-full hover:bg-bg-tertiary text-text-secondary transition-colors"
            aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ''}`}
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px] font-medium rounded-full bg-accent text-text-inverse">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </Link>
          <Link
            to="/messages"
            className="p-2 rounded-full hover:bg-bg-tertiary text-text-secondary transition-colors"
            aria-label="Messages"
          >
            <MessageCircle className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  )
}
