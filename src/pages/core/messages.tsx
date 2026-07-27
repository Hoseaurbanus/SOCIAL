import { Link } from 'react-router'
import { Search, Settings, Edit } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Avatar } from '@/components/atoms/avatar'
import { useConversations } from '@/hooks/use-messages'
import { UserSearchModal } from '@/components/organisms/user-search-modal'
import { useState } from 'react'
import { timeAgo } from '@/lib/timeago'

export default function MessagesPage() {
  const { data: conversations, isLoading, error } = useConversations()
  const [search, setSearch] = useState('')
  const [showNewMessage, setShowNewMessage] = useState(false)

  const filtered = conversations?.filter((c) =>
    c.participants.some((p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.username?.toLowerCase().includes(search.toLowerCase())
    )
  ) || []

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-text-secondary mb-2">Failed to load messages.</p>
        <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h1 className="text-xl font-bold text-text-primary">Messages</h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" aria-label="Settings">
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowNewMessage(true)} aria-label="New message">
            <Edit className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-bg-secondary text-text-primary text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
            aria-label="Search messages"
          />
        </div>
      </div>

      {/* Conversations */}
      {isLoading ? (
        <div className="divide-y divide-border">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
              <div className="h-12 w-12 rounded-full bg-bg-tertiary" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-bg-tertiary rounded" />
                <div className="h-3 w-48 bg-bg-tertiary rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-text-secondary mb-2">No conversations yet</p>
          <p className="text-text-tertiary text-sm">Start a conversation with someone.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filtered.map((conv) => {
            const other = conv.participants[0]
            if (!other) return null
            return (
              <Link
                key={conv.id}
                to={`/messages/${conv.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-bg-secondary transition-colors"
              >
                <Avatar
                  src={other.avatar}
                  alt={other.name}
                  size="md"
                  status="online"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-text-primary truncate">{other.name}</p>
                    {conv.lastMessage && (
                      <p className="text-xs text-text-tertiary">{timeAgo(conv.lastMessage.created_at)}</p>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <p className="text-sm text-text-secondary truncate">{conv.lastMessage.content}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
      <UserSearchModal isOpen={showNewMessage} onClose={() => setShowNewMessage(false)} />
    </div>
  )
}
