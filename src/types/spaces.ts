export type SpaceType = 
  | 'community'
  | 'classroom'
  | 'organization'
  | 'project'
  | 'event'
  | 'creator_hub'
  | 'research_group';

export type SpaceVisibility = 'public' | 'private' | 'hidden';

export type SpaceMemberRole = 'owner' | 'admin' | 'moderator' | 'member';

export type SpaceMemberStatus = 'active' | 'pending' | 'banned' | 'muted';

export interface SpaceModules {
  feed: boolean;
  chat: boolean;
  events: boolean;
  assignments: boolean;
  resources: boolean;
  grades: boolean;
  live_sessions: boolean;
  polls: boolean;
  announcements: boolean;
}

export interface Space {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  cover_image: string | null;
  slug: string;
  space_type: SpaceType;
  visibility: SpaceVisibility;
  created_by: string;
  settings: { modules: SpaceModules };
  metadata: Record<string, unknown>;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface SpaceMember {
  space_id: string;
  user_id: string;
  role: SpaceMemberRole;
  status: SpaceMemberStatus;
  role_id: string | null;
  joined_at: string;
  user?: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
}

export interface SpaceWithMembership extends Space {
  is_member: boolean;
  member_role?: SpaceMemberRole;
}

export interface SpaceRole {
  id: string;
  name: string;
  permissions: string[];
  is_system: boolean;
}

export const SPACE_PERMISSIONS = {
  SPACE_EDIT: 'space.edit',
  SPACE_DELETE: 'space.delete',
  MEMBER_REMOVE: 'member.remove',
  MEMBER_BAN: 'member.ban',
  MEMBER_MUTE: 'member.mute',
  CONTENT_PIN: 'content.pin',
  CONTENT_DELETE: 'content.delete',
  CONTENT_LOCK: 'content.lock',
  MODULE_MANAGE: 'module.manage',
  CONTENT_CREATE: 'content.create',
  CONTENT_READ: 'content.read',
  CONTENT_REACT: 'content.react',
  CONTENT_COMMENT: 'content.comment',
} as const;

export type SpacePermission = typeof SPACE_PERMISSIONS[keyof typeof SPACE_PERMISSIONS];

export const DEFAULT_SPACE_MODULES: Record<SpaceType, SpaceModules> = {
  community: {
    feed: true,
    chat: true,
    events: true,
    assignments: false,
    resources: false,
    grades: false,
    live_sessions: false,
    polls: true,
    announcements: true,
  },
  classroom: {
    feed: true,
    chat: true,
    events: false,
    assignments: true,
    resources: true,
    grades: true,
    live_sessions: true,
    polls: false,
    announcements: true,
  },
  organization: {
    feed: true,
    chat: true,
    events: true,
    assignments: false,
    resources: true,
    grades: false,
    live_sessions: false,
    polls: true,
    announcements: true,
  },
  project: {
    feed: true,
    chat: true,
    events: false,
    assignments: false,
    resources: true,
    grades: false,
    live_sessions: false,
    polls: false,
    announcements: true,
  },
  event: {
    feed: true,
    chat: true,
    events: true,
    assignments: false,
    resources: false,
    grades: false,
    live_sessions: false,
    polls: true,
    announcements: true,
  },
  creator_hub: {
    feed: true,
    chat: true,
    events: true,
    assignments: false,
    resources: false,
    grades: false,
    live_sessions: true,
    polls: true,
    announcements: true,
  },
  research_group: {
    feed: true,
    chat: true,
    events: true,
    assignments: false,
    resources: true,
    grades: false,
    live_sessions: false,
    polls: true,
    announcements: true,
  },
};

export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  community: 'Community',
  classroom: 'Classroom',
  organization: 'Organization',
  project: 'Project',
  event: 'Event',
  creator_hub: 'Creator Hub',
  research_group: 'Research Group',
};

export const SPACE_TYPE_ICONS: Record<SpaceType, string> = {
  community: '🌐',
  classroom: '📚',
  organization: '🏢',
  project: '🚀',
  event: '📅',
  creator_hub: '🎨',
  research_group: '🔬',
};
