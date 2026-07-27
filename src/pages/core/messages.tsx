import { Search, Edit } from 'lucide-react'
import { Avatar } from '@/components/atoms/avatar'

const conversations = [
  { id: '1', name: 'Alex Johnson', lastMessage: 'Hey, did you see the new design tokens?', time: '2m', unread: 2, online: true },
  { id: '2', name: 'Sarah Chen', lastMessage: 'The TypeScript update looks great!', time: '15m', unread: 0, online: true },
  { id: '3', name: 'Marcus Rivera', lastMessage: 'Let me know when you are free to chat', time: '1h', unread: 1, online: false },
  { id: '4', name: 'Kim Lee', lastMessage: 'Thanks for the feedback!', time: '3h', unread: 0, online: false },
  { id: '5', name: 'Taylor Wilson', lastMessage: 'See you at the meetup tomorrow', time: '1d', unread: 0, online: false },
]

export default function MessagesPage() {
  return (
    <div className="max-w-[600px] mx-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h1 className="text-xl font-bold text-text-primary">Messages</h1>
        <button className="p-2 rounded-full hover:bg-bg-tertiary text-text-secondary">
          <Edit className="h-5 w-5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input type="text" placeholder="Search messages..." className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-bg-primary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors" />
        </div>
      </div>

      {/* Conversations */}
      <div className="divide-y divide-border">
        {conversations.map((conv) => (
          <button key={conv.id} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-tertiary transition-colors text-left">
            <div className="relative">
              <Avatar alt={conv.name} size="md" />
              {conv.online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-bg-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-primary truncate">{conv.name}</span>
                <span className="text-sm text-text-tertiary">{conv.time}</span>
              </div>
              <p className="text-sm text-text-secondary truncate">{conv.lastMessage}</p>
            </div>
            {conv.unread > 0 && (
              <span className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-xs font-medium rounded-full bg-accent text-text-inverse">
                {conv.unread}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
