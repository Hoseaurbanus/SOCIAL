import { useState } from 'react'
import { useNavigate } from 'react-router'
import { X, Search } from 'lucide-react'
import { Avatar } from '@/components/atoms/avatar'
import { useCreateConversation } from '@/hooks/use-messages'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/config/supabase'
import type { User } from '@/types/api'

interface UserSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UserSearchModal({ isOpen, onClose }: UserSearchModalProps) {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const toast = useToast((s) => s.toast)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [searching, setSearching] = useState(false)
  const createConversation = useCreateConversation()

  const handleSearch = async (query: string) => {
    setSearch(query)
    if (query.length < 2) { setResults([]); return }
    setSearching(true)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, username, avatar')
        .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(10)
      setResults(((data || []) as User[]).filter((u) => u.id !== currentUser?.id))
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleSelectUser = async (userId: string) => {
    try {
      const convId = await createConversation.mutateAsync(userId)
      onClose()
      navigate(`/messages/${convId}`)
    } catch {
      toast({ title: 'Failed to start conversation', variant: 'error' })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-[420px] bg-bg-primary rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button onClick={onClose} className="p-1 rounded-full hover:bg-bg-tertiary text-text-secondary">
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-base font-semibold text-text-primary">New Message</h2>
          <div className="w-8" />
        </div>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search people..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-bg-secondary text-text-primary text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {searching && (
            <div className="p-4 text-center text-text-tertiary text-sm">Searching...</div>
          )}
          {!searching && results.length === 0 && search.length >= 2 && (
            <div className="p-4 text-center text-text-tertiary text-sm">No users found</div>
          )}
          {results.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelectUser(user.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-secondary transition-colors"
            >
              <Avatar src={user.avatar} alt={user.name} size="sm" />
              <div className="text-left">
                <p className="text-sm font-medium text-text-primary">{user.name}</p>
                <p className="text-xs text-text-tertiary">@{user.username}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
