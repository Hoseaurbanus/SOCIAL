import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ChevronLeft, Send } from 'lucide-react'
import { Avatar } from '@/components/atoms/avatar'
import { useMessages, useSendMessage, useMarkAsRead } from '@/hooks/use-messages'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/config/supabase'

export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { data: messages = [], isLoading } = useMessages(conversationId || '')
  const sendMessage = useSendMessage()
  const markAsRead = useMarkAsRead()
  const [newMessage, setNewMessage] = useState('')
  const [otherUser, setOtherUser] = useState<{ name: string; username: string; avatar?: string } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!conversationId) return
    const loadParticipant = async () => {
      const { data } = await supabase
        .from('conversation_participants')
        .select('user:profiles(name, username, avatar)')
        .eq('conversation_id', conversationId)
        .neq('user_id', user?.id || '')
        .limit(1)
        .single()
      if (data?.user) setOtherUser(data.user as any)
    }
    loadParticipant()
  }, [conversationId, user?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (conversationId) markAsRead.mutate(conversationId)
  }, [conversationId, messages.length])

  const handleSend = () => {
    if (!newMessage.trim() || !conversationId) return
    sendMessage.mutate(
      { conversationId, content: newMessage.trim() },
      { onSuccess: () => setNewMessage('') }
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-bg-primary">
        <button onClick={() => navigate('/messages')} className="p-2 rounded-full hover:bg-bg-tertiary text-text-secondary">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <Avatar src={otherUser?.avatar} alt={otherUser?.name} size="sm" />
        <div>
          <p className="text-sm font-medium text-text-primary">{otherUser?.name || 'Loading...'}</p>
          <p className="text-xs text-text-tertiary">@{otherUser?.username}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-tertiary text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === user?.id
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  isOwn
                    ? 'bg-accent text-white rounded-br-sm'
                    : 'bg-bg-tertiary text-text-primary rounded-bl-sm'
                }`}>
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/70' : 'text-text-tertiary'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-bg-primary">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-border bg-bg-secondary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors max-h-32"
            aria-label="Message input"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="p-2.5 rounded-full bg-accent text-white disabled:opacity-50 transition-opacity"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
