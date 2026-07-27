import { Heart, MessageCircle, UserPlus, AtSign, Settings } from 'lucide-react'
import { Avatar } from '@/components/atoms/avatar'
import { cn } from '@/lib/utils'

const notifications = [
  { id: '1', type: 'like', user: 'Alex Johnson', content: 'liked your post about design tokens', time: '2m', icon: Heart, iconColor: 'text-error' },
  { id: '2', type: 'comment', user: 'Sarah Chen', content: 'commented on your post', time: '15m', icon: MessageCircle, iconColor: 'text-info' },
  { id: '3', type: 'follow', user: 'Marcus Rivera', content: 'started following you', time: '1h', icon: UserPlus, iconColor: 'text-success' },
  { id: '4', type: 'mention', user: 'Kim Lee', content: 'mentioned you in a comment', time: '3h', icon: AtSign, iconColor: 'text-accent' },
  { id: '5', type: 'like', user: 'Taylor Wilson', content: 'liked your comment', time: '1d', icon: Heart, iconColor: 'text-error' },
]

export default function NotificationsPage() {
  return (
    <div className="max-w-[600px] mx-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h1 className="text-xl font-bold text-text-primary">Notifications</h1>
        <button className="p-2 rounded-full hover:bg-bg-tertiary text-text-secondary">
          <Settings className="h-5 w-5" />
        </button>
      </div>

      <div className="divide-y divide-border">
        {notifications.map((notif) => (
          <button key={notif.id} className="w-full flex items-start gap-3 px-4 py-3 hover:bg-bg-tertiary transition-colors text-left">
            <div className="relative">
              <Avatar alt={notif.user} size="md" />
              <div className={cn('absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center bg-bg-primary', notif.iconColor)}>
                <notif.icon className="h-3 w-3" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary">
                <span className="font-semibold">{notif.user}</span>{' '}
                {notif.content}
              </p>
              <span className="text-xs text-text-tertiary">{notif.time}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
