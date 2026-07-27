import { Settings, Heart, MessageCircle, UserPlus, AtSign } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Avatar } from '@/components/atoms/avatar'
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from '@/hooks/use-notifications'
import { useEffect } from 'react'

const iconMap = {
  like: { icon: Heart, color: 'text-red-500', bg: 'bg-red-500/10' },
  comment: { icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  follow: { icon: UserPlus, color: 'text-green-500', bg: 'bg-green-500/10' },
  mention: { icon: AtSign, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  message: { icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
}

export default function NotificationsPage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllRead()

  const notifications = data?.pages.flatMap((p) => p.notifications) || []

  useEffect(() => {
    notifications.forEach((n) => {
      if (!n.is_read) {
        markRead.mutate(n.id)
      }
    })
  }, [notifications, markRead])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h1 className="text-xl font-bold text-text-primary">Notifications</h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()}>
            Mark all read
          </Button>
          <Button variant="ghost" size="sm" aria-label="Settings">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {isLoading ? (
        <div className="divide-y divide-border">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-bg-tertiary" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-bg-tertiary rounded" />
                <div className="h-3 w-24 bg-bg-tertiary rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-text-secondary mb-2">No notifications yet</p>
          <p className="text-text-tertiary text-sm">You'll see notifications when people interact with your posts.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {notifications.map((notification) => {
            const config = iconMap[notification.type] || iconMap.like
            const Icon = config.icon
            return (
              <div
                key={notification.id}
                className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                  !notification.is_read ? 'bg-accent/5' : ''
                }`}
              >
                <div className={`p-2 rounded-full ${config.bg}`}>
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={notification.from_user.avatar}
                      alt={notification.from_user.name}
                      size="xs"
                    />
                    <p className="text-sm text-text-primary">
                      <span className="font-medium">{notification.from_user.name}</span>{' '}
                      {notification.message}
                    </p>
                  </div>
                  <p className="text-xs text-text-tertiary mt-1">
                    {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="h-2 w-2 rounded-full bg-accent flex-shrink-0 mt-2" />
                )}
              </div>
            )
          })}
          <div className="py-4">
            {isFetchingNextPage && (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
              </div>
            )}
            {hasNextPage && !isFetchingNextPage && (
              <Button variant="ghost" fullWidth onClick={() => fetchNextPage()}>
                Load more
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
