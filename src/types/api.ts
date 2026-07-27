export interface ApiResponse<T> { data: T; message?: string; success: boolean }
export interface PaginatedResponse<T> { data: T[]; total: number; page: number; pageSize: number; hasMore: boolean }
export interface ApiError { message: string; code?: string; errors?: Record<string, string[]> }

export interface User {
  id: string
  email: string
  phone?: string
  name: string
  username: string
  avatar?: string
  bio?: string
  website?: string
  location?: string
  is_private: boolean
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  user_id: string
  content: string
  images?: string[]
  likes_count: number
  comments_count: number
  shares_count: number
  created_at: string
  user: Pick<User, 'id' | 'name' | 'username' | 'avatar'>
}

export interface Story {
  id: string
  user_id: string
  media_url: string
  media_type: 'image' | 'video'
  created_at: string
  expires_at: string
  user: Pick<User, 'id' | 'name' | 'username' | 'avatar'>
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  read_at?: string
}

export interface Conversation {
  id: string
  participants: User[]
  lastMessage?: Message
  updatedAt: string
}

export interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow' | 'mention' | 'message'
  user_id: string
  from_user_id: string
  from_user: Pick<User, 'id' | 'name' | 'username' | 'avatar'>
  post_id?: string
  message: string
  is_read: boolean
  created_at: string
}
