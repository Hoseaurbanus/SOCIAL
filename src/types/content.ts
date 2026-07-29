export type ContentType = 'post' | 'article' | 'announcement' | 'assignment' | 'poll' | 'resource' | 'event';

export type ContentVisibility = 'public' | 'members' | 'private';

export interface ContentMedia {
  type: 'image' | 'video' | 'file';
  url: string;
  thumbnail?: string;
  name?: string;
}

export interface ContentItem {
  id: string;
  author_id: string;
  space_id: string | null;
  content_type: ContentType;
  title: string | null;
  body: string;
  media: ContentMedia[];
  metadata: Record<string, unknown>;
  visibility: ContentVisibility;
  is_pinned: boolean;
  is_locked: boolean;
  reaction_count: number;
  comment_count: number;
  share_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
}

export interface Reaction {
  id: string;
  user_id: string;
  content_item_id: string;
  emoji: string;
  created_at: string;
  user?: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
}

export interface Comment {
  id: string;
  content_item_id: string;
  author_id: string;
  parent_comment_id: string | null;
  body: string;
  reaction_count: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
}

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  post: 'Post',
  article: 'Article',
  announcement: 'Announcement',
  assignment: 'Assignment',
  poll: 'Poll',
  resource: 'Resource',
  event: 'Event',
};

export const CONTENT_TYPE_ICONS: Record<ContentType, string> = {
  post: '📝',
  article: '📄',
  announcement: '📢',
  assignment: '📋',
  poll: '📊',
  resource: '📚',
  event: '📅',
};
