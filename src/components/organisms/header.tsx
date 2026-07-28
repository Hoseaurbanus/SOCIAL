import { Link, useLocation } from 'react-router'
import { Search, Bell, MessageCircle, X } from 'lucide-react'
import { useUnreadCount } from '@/hooks/use-notifications'
import { SmugflexLogo } from '@/components/atoms/smugflex-logo'
import { useScrollDirection } from '@/hooks/use-scroll-direction'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

export function Header() {
  const { data: notificationCount = 0 } = useUnreadCount()
  const { direction, isAtTop, scrollY } = useScrollDirection(5)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const location = useLocation()

  const isHidden = direction === 'down' && scrollY > 100 && !isAtTop
  const isCompact = !isAtTop && !searchOpen

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchOpen])

  useEffect(() => {
    setSearchOpen(false)
    setSearchFocused(false)
  }, [location.pathname])

  const handleSearchToggle = () => {
    setSearchOpen(!searchOpen)
    if (searchOpen) {
      setSearchFocused(false)
    }
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-header transition-all duration-300 ease-out',
        'bg-bg-primary/95 backdrop-blur-xl',
        'border-b border-border',
        isHidden ? '-translate-y-full' : 'translate-y-0',
        isCompact ? 'shadow-sm' : ''
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 max-w-[1200px] mx-auto">
        {/* Logo */}
        <Link
          to="/home"
          className={cn(
            'flex items-center transition-all duration-300',
            searchOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
          )}
        >
          <SmugflexLogo size="sm" variant="full" />
        </Link>

        {/* Search - Desktop */}
        <div className={cn(
          'flex-1 max-w-md mx-4 hidden md:block transition-all duration-300',
          searchOpen ? 'max-w-lg' : ''
        )}>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary group-focus-within:text-accent transition-colors" />
            <input
              type="text"
              placeholder="Search S.S..."
              className={cn(
                'w-full h-10 pl-10 pr-4 rounded-2xl border-2 bg-bg-secondary text-text-primary text-sm',
                'placeholder:text-text-tertiary transition-all duration-200',
                'focus:border-accent focus:bg-bg-primary focus:ring-0 focus:shadow-lg focus:shadow-accent/10',
                'border-transparent hover:border-border-strong'
              )}
              aria-label="Search"
            />
          </div>
        </div>

        {/* Search - Mobile */}
        {searchOpen && (
          <div className="flex-1 md:hidden px-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={cn(
                  'w-full h-10 pl-10 pr-10 rounded-2xl border-2 bg-bg-secondary text-text-primary text-sm',
                  'placeholder:text-text-tertiary transition-all duration-200',
                  searchFocused ? 'border-accent bg-bg-primary' : 'border-transparent'
                )}
                aria-label="Search"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className={cn(
          'flex items-center gap-1 transition-all duration-300',
          searchOpen ? 'md:flex hidden' : ''
        )}>
          {/* Mobile search toggle */}
          <button
            onClick={handleSearchToggle}
            className="md:hidden p-2.5 rounded-2xl hover:bg-bg-tertiary text-text-secondary transition-all duration-200 active:scale-95"
            aria-label={searchOpen ? 'Close search' : 'Open search'}
          >
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>

          {/* Notifications */}
          <Link
            to="/notifications"
            className={cn(
              'relative p-2.5 rounded-2xl text-text-secondary transition-all duration-200',
              'hover:bg-accent-light hover:text-accent active:scale-95',
              location.pathname === '/notifications' && 'bg-accent-light text-accent'
            )}
            aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ''}`}
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-secondary text-white shadow-lg shadow-secondary/30 animate-pulse">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </Link>

          {/* Messages */}
          <Link
            to="/messages"
            className={cn(
              'relative p-2.5 rounded-2xl text-text-secondary transition-all duration-200',
              'hover:bg-accent-light hover:text-accent active:scale-95',
              location.pathname.startsWith('/messages') && 'bg-accent-light text-accent'
            )}
            aria-label="Messages"
          >
            <MessageCircle className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  )
}
