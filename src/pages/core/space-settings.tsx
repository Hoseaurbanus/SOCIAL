import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react';
import { useSpace, useUpdateSpace, useUpdateSpaceModules, useDeleteSpace } from '@/hooks/use-spaces';
import { canEditSpace, canDeleteSpace, canManageModules } from '@/lib/rbac';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import type { SpaceModules, SpaceMemberRole } from '@/types/spaces';

export default function SpaceSettingsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const { data: space, isLoading: spaceLoading } = useSpace(slug || '');
  const updateSpaceMutation = useUpdateSpace();
  const updateModulesMutation = useUpdateSpaceModules();
  const deleteSpaceMutation = useDeleteSpace();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'hidden'>('public');
  const [modules, setModules] = useState<SpaceModules>({
    feed: true,
    chat: true,
    events: false,
    assignments: false,
    resources: false,
    grades: false,
    live_sessions: false,
    polls: true,
    announcements: true,
  });
  
  useEffect(() => {
    if (space) {
      setName(space.name);
      setDescription(space.description || '');
      setIcon(space.icon);
      setVisibility(space.visibility);
      if (space.settings?.modules) {
        setModules(space.settings.modules);
      }
    }
  }, [space]);
  
  if (spaceLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }
  
  if (!space) {
    navigate('/spaces');
    return null;
  }
  
  const role: SpaceMemberRole | null = space.member_role ?? null;
  const canEdit = canEditSpace(role);
  const canManage = canManageModules(role);
  const canDelete = canDeleteSpace(role);
  
  if (!canEdit && !canManage) {
    navigate(`/space/${slug}`);
    return null;
  }
  
  const handleSaveSettings = () => {
    if (!canEdit) return;
    
    updateSpaceMutation.mutate(
      {
        spaceId: space.id,
        updates: {
          name,
          description,
          icon,
          visibility,
        },
      },
      {
        onSuccess: () => {
          navigate(`/space/${slug}`);
        },
      }
    );
  };
  
  const handleSaveModules = () => {
    if (!canManage) return;
    
    updateModulesMutation.mutate(
      {
        spaceId: space.id,
        modules,
      },
      {
        onSuccess: () => {
          navigate(`/space/${slug}`);
        },
      }
    );
  };
  
  const handleDelete = () => {
    if (!canDelete) return;
    
    if (window.confirm('Are you sure you want to delete this space? This action cannot be undone.')) {
      deleteSpaceMutation.mutate(space.id, {
        onSuccess: () => {
          navigate('/spaces');
        },
      });
    }
  };
  
  const moduleOptions: { key: keyof SpaceModules; label: string; description: string }[] = [
    { key: 'feed', label: 'Feed', description: 'Allow members to create and view posts' },
    { key: 'chat', label: 'Chat', description: 'Enable real-time messaging' },
    { key: 'events', label: 'Events', description: 'Allow creating and RSVPing to events' },
    { key: 'assignments', label: 'Assignments', description: 'Enable assignment creation and submission' },
    { key: 'resources', label: 'Resources', description: 'Allow sharing files and links' },
    { key: 'grades', label: 'Grades', description: 'Enable grading system for assignments' },
    { key: 'live_sessions', label: 'Live Sessions', description: 'Enable live video/audio sessions' },
    { key: 'polls', label: 'Polls', description: 'Allow creating and voting on polls' },
    { key: 'announcements', label: 'Announcements', description: 'Enable pinned announcements' },
  ];
  
  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      <div className="sticky top-0 z-20 glass border-b border-border-primary">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </button>
          <h1 className="text-lg font-bold text-text-primary">Space Settings</h1>
        </div>
      </div>
      
      <div className="px-4 py-4 space-y-6">
        {canEdit && (
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                <Input
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  placeholder="Space name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  placeholder="Space description"
                  className="w-full px-3 py-2 rounded-xl border border-border-primary bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Icon</label>
                <Input
                  value={icon}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIcon(e.target.value)}
                  placeholder="Emoji icon"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Visibility</label>
                <select
                  value={visibility}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setVisibility(e.target.value as typeof visibility)}
                  className="w-full px-3 py-2 rounded-xl border border-border-primary bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="public">Public - Anyone can find and join</option>
                  <option value="private">Private - Invite only</option>
                  <option value="hidden">Hidden - Only members can see</option>
                </select>
              </div>
              <Button onClick={handleSaveSettings} disabled={updateSpaceMutation.isPending}>
                {updateSpaceMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </section>
        )}
        
        {canManage && (
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-4">Modules</h2>
            <p className="text-sm text-text-secondary mb-4">
              Enable or disable features for this space.
            </p>
            <div className="space-y-3">
              {moduleOptions.map(option => (
                <div
                  key={option.key}
                  className="flex items-center justify-between p-3 rounded-xl bg-bg-secondary"
                >
                  <div>
                    <p className="font-medium text-text-primary">{option.label}</p>
                    <p className="text-sm text-text-secondary">{option.description}</p>
                  </div>
                  <button
                    onClick={() => setModules(prev => ({ ...prev, [option.key]: !prev[option.key] }))}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      modules[option.key] ? 'bg-accent' : 'bg-bg-tertiary'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        modules[option.key] ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
            <Button onClick={handleSaveModules} disabled={updateModulesMutation.isPending} className="mt-4">
              {updateModulesMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Modules
            </Button>
          </section>
        )}
        
        {canDelete && (
          <section className="border border-red-200 rounded-2xl p-4">
            <h2 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h2>
            <p className="text-sm text-text-secondary mb-4">
              Deleting this space will remove all content and members. This action cannot be undone.
            </p>
            <Button
              variant="secondary"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleDelete}
              disabled={deleteSpaceMutation.isPending}
            >
              {deleteSpaceMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete Space
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}
