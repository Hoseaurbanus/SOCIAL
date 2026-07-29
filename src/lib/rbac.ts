import type { SpacePermission, SpaceMemberRole } from '@/types/spaces';

const PERMISSION_MATRIX: Record<SpaceMemberRole, SpacePermission[]> = {
  owner: [
    'space.edit',
    'space.delete',
    'member.remove',
    'member.ban',
    'member.mute',
    'content.pin',
    'content.delete',
    'content.lock',
    'module.manage',
    'content.create',
    'content.read',
    'content.react',
    'content.comment',
  ],
  admin: [
    'space.edit',
    'member.remove',
    'member.ban',
    'member.mute',
    'content.pin',
    'content.delete',
    'content.lock',
    'content.create',
    'content.read',
    'content.react',
    'content.comment',
  ],
  moderator: [
    'member.mute',
    'content.pin',
    'content.delete',
    'content.create',
    'content.read',
    'content.react',
    'content.comment',
  ],
  member: [
    'content.create',
    'content.read',
    'content.react',
    'content.comment',
  ],
};

export function hasPermission(role: SpaceMemberRole, permission: SpacePermission): boolean {
  return PERMISSION_MATRIX[role]?.includes(permission) ?? false;
}

export function getUserRole(memberships: { space_id: string; role: SpaceMemberRole }[], spaceId: string): SpaceMemberRole | null {
  return memberships.find(m => m.space_id === spaceId)?.role ?? null;
}

export function canPerformAction(
  role: SpaceMemberRole | null,
  action: SpacePermission
): boolean {
  if (!role) return false;
  return hasPermission(role, action);
}

export function canEditSpace(role: SpaceMemberRole | null): boolean {
  return canPerformAction(role, 'space.edit');
}

export function canDeleteSpace(role: SpaceMemberRole | null): boolean {
  return canPerformAction(role, 'space.delete');
}

export function canRemoveMember(role: SpaceMemberRole | null): boolean {
  return canPerformAction(role, 'member.remove');
}

export function canPinContent(role: SpaceMemberRole | null): boolean {
  return canPerformAction(role, 'content.pin');
}

export function canDeleteContent(role: SpaceMemberRole | null): boolean {
  return canPerformAction(role, 'content.delete');
}

export function canLockContent(role: SpaceMemberRole | null): boolean {
  return canPerformAction(role, 'content.lock');
}

export function canManageModules(role: SpaceMemberRole | null): boolean {
  return canPerformAction(role, 'module.manage');
}

export function canCreateContent(role: SpaceMemberRole | null): boolean {
  return canPerformAction(role, 'content.create');
}

export function canReact(role: SpaceMemberRole | null): boolean {
  return canPerformAction(role, 'content.react');
}

export function canComment(role: SpaceMemberRole | null): boolean {
  return canPerformAction(role, 'content.comment');
}
