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
  isPrivate: boolean
  createdAt: string
}

export interface Post {
  id: string
  userId: string
  content: string
  images?: string[]
  likesCount: number
  commentsCount: number
  sharesCount: number
  isLiked: boolean
  isBookmarked: boolean
  createdAt: string
  user: Pick<User, 'id' | 'name' | 'username' | 'avatar'>
}

export interface Story {
  id: string
  userId: string
  mediaUrl: string
  mediaType: 'image' | 'video'
  createdAt: string
  expiresAt: string
  user: Pick<User, 'id' | 'name' | 'username' | 'avatar'>
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
  readAt?: string
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
  fromUser: Pick<User, 'id' | 'name' | 'username' | 'avatar'>
  postId?: string
  message: string
  isRead: boolean
  createdAt: string
}
