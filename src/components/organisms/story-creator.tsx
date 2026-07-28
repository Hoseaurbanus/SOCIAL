import { useState, useRef, useCallback } from 'react'
import { X, Type, Image, Music, Smile, Palette, ArrowLeft, Eye, Send } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Avatar } from '@/components/atoms/avatar'
import { cn } from '@/lib/utils'
import { BACKGROUND_PRESETS } from '@/lib/story-presets'
import type { StorySticker, TextOverlay } from '@/types/api'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'

interface StoryCreatorProps {
  isOpen: boolean
  onClose: () => void
  onPost: (story: StoryDraft) => Promise<void>
}

export interface StoryDraft {
  mode: 'text' | 'image' | 'video'
  content?: string
  backgroundImage?: string
  textColor?: string
  fontStyle?: string
  mediaFile?: File
  mediaPreview?: string
  filter?: string
  musicUrl?: string
  musicTitle?: string
  stickers?: StorySticker[]
  textOverlays?: TextOverlay[]
}

const tabs = [
  { id: 'text', label: 'Text', icon: Type },
  { id: 'upload', label: 'Upload', icon: Image },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'stickers', label: 'Stickers', icon: Smile },
  { id: 'style', label: 'Style', icon: Palette },
]

export function StoryCreator({ isOpen, onClose, onPost }: StoryCreatorProps) {
  const [activeTab, setActiveTab] = useState('text')
  const [draft, setDraft] = useState<StoryDraft>({
    mode: 'text',
    textColor: '#FFFFFF',
    fontStyle: 'sans',
    filter: 'none',
  })
  const [posting, setPosting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const user = useAuthStore((s) => s.user)
  const toast = useToast((s) => s.toast)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateDraft = useCallback((updates: Partial<StoryDraft>) => {
    setDraft((prev) => ({ ...prev, ...updates }))
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isVideo = file.type.startsWith('video/')
    updateDraft({
      mode: isVideo ? 'video' : 'image',
      mediaFile: file,
      mediaPreview: URL.createObjectURL(file),
    })
    setActiveTab('upload')
  }

  const handlePost = async () => {
    if (draft.mode === 'text' && !draft.backgroundImage) {
      toast({ title: 'Please select a background', variant: 'error' })
      return
    }
    if ((draft.mode === 'image' || draft.mode === 'video') && !draft.mediaFile) {
      toast({ title: 'Please select media', variant: 'error' })
      return
    }
    setPosting(true)
    try {
      await onPost(draft)
      onClose()
    } catch {
      toast({ title: 'Failed to post story', variant: 'error' })
    } finally {
      setPosting(false)
    }
  }

  if (!isOpen) return null

  if (showPreview) {
    return (
      <StoryPreview
        draft={draft}
        user={user}
        onClose={() => setShowPreview(false)}
        onPost={handlePost}
        posting={posting}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-modal bg-bg-primary flex flex-col" role="dialog" aria-modal="true" aria-label="Create story">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-bg-tertiary text-text-secondary" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-base font-semibold text-text-primary">New Story</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(true)}
            disabled={draft.mode === 'text' && !draft.backgroundImage}
            aria-label="Preview"
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button
            size="sm"
            loading={posting}
            onClick={handlePost}
            disabled={posting || (draft.mode === 'text' && !draft.backgroundImage)}
          >
            <Send className="h-4 w-4 mr-1" />
            Post
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div
          className="relative w-full max-w-[360px] aspect-[9/16] rounded-2xl overflow-hidden flex items-center justify-center"
          style={getStyleForDraft(draft)}
        >
          {draft.mode === 'text' && draft.backgroundImage && (
            <p
              className={cn(
                'text-center px-8 text-2xl font-bold whitespace-pre-wrap break-words',
                getFontClass(draft.fontStyle)
              )}
              style={{ color: draft.textColor }}
            >
              {draft.content || 'Tap to add text'}
            </p>
          )}
          {draft.mode === 'text' && !draft.backgroundImage && (
            <div className="text-center px-8 text-text-tertiary">
              <Type className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Select a background below</p>
            </div>
          )}
          {draft.mediaPreview && (
            <img
              src={draft.mediaPreview}
              alt="Story preview"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: draft.filter }}
            />
          )}
          {draft.mediaPreview && draft.content && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p
                className={cn(
                  'text-center px-8 text-2xl font-bold whitespace-pre-wrap break-words drop-shadow-lg',
                  getFontClass(draft.fontStyle)
                )}
                style={{ color: draft.textColor }}
              >
                {draft.content}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Content Input */}
      <div className="px-4 pb-2">
        <textarea
          value={draft.content || ''}
          onChange={(e) => updateDraft({ content: e.target.value })}
          placeholder="Add text to your story..."
          rows={2}
          maxLength={200}
          className="w-full bg-bg-secondary border border-border rounded-2xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-0 resize-none"
          aria-label="Story text"
        />
      </div>

      {/* Tab Bar */}
      <div className="flex border-t border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === 'upload') {
                fileInputRef.current?.click()
              } else {
                setActiveTab(tab.id)
              }
            }}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
              activeTab === tab.id
                ? 'text-accent border-t-2 border-accent -mt-px'
                : 'text-text-secondary hover:text-text-primary'
            )}
            aria-label={tab.label}
          >
            <tab.icon className="h-5 w-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="border-t border-border bg-bg-secondary">
        {activeTab === 'text' && (
          <TextTab draft={draft} onUpdate={updateDraft} />
        )}
        {activeTab === 'music' && (
          <MusicTab draft={draft} onUpdate={updateDraft} />
        )}
        {activeTab === 'stickers' && (
          <StickersTab draft={draft} onUpdate={updateDraft} />
        )}
        {activeTab === 'style' && (
          <StyleTab draft={draft} onUpdate={updateDraft} />
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  )
}

function TextTab({ draft, onUpdate }: { draft: StoryDraft; onUpdate: (u: Partial<StoryDraft>) => void }) {
  return (
    <div className="p-4 max-h-[200px] overflow-y-auto">
      <p className="text-xs font-medium text-text-secondary mb-3">Background</p>
      <div className="grid grid-cols-8 gap-2">
        {BACKGROUND_PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => onUpdate({ backgroundImage: preset.value })}
            className={cn(
              'h-10 w-10 rounded-xl border-2 transition-all',
              draft.backgroundImage === preset.value
                ? 'border-accent scale-110 shadow-lg'
                : 'border-transparent hover:scale-105'
            )}
            style={{ background: preset.value }}
            aria-label={preset.name}
          />
        ))}
      </div>
    </div>
  )
}

function MusicTab({ draft, onUpdate }: { draft: StoryDraft; onUpdate: (u: Partial<StoryDraft>) => void }) {
  const [url, setUrl] = useState(draft.musicUrl || '')
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    if (!url.trim()) return
    setLoading(true)
    try {
      const embedUrl = getYouTubeEmbedUrl(url)
      if (embedUrl) {
        const title = await fetchYouTubeTitle(url)
        onUpdate({ musicUrl: embedUrl, musicTitle: title || 'YouTube video' })
      } else {
        onUpdate({ musicUrl: url, musicTitle: 'Audio' })
      }
    } catch {
      onUpdate({ musicUrl: url, musicTitle: 'Audio' })
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = () => {
    setUrl('')
    onUpdate({ musicUrl: undefined, musicTitle: undefined })
  }

  return (
    <div className="p-4 max-h-[200px] overflow-y-auto">
      {draft.musicUrl ? (
        <div className="flex items-center gap-3 p-3 bg-bg-primary rounded-2xl border border-border">
          <Music className="h-5 w-5 text-accent flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{draft.musicTitle}</p>
            <p className="text-xs text-text-tertiary truncate">{draft.musicUrl}</p>
          </div>
          <button onClick={handleRemove} className="p-1 rounded-full hover:bg-bg-tertiary text-text-secondary" aria-label="Remove music">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube or audio URL..."
            className="flex-1 h-10 px-4 rounded-2xl border border-border bg-bg-primary text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-0"
            aria-label="Music URL"
          />
          <Button size="sm" onClick={handleAdd} loading={loading} disabled={!url.trim()}>
            Add
          </Button>
        </div>
      )}
    </div>
  )
}

function StickersTab({ draft, onUpdate }: { draft: StoryDraft; onUpdate: (u: Partial<StoryDraft>) => void }) {
  const emojis = ['😀','😂','😍','🥺','🔥','✨','🎉','❤️','👍','💀','🤔','😎','🥳','😭','🙌','💪']

  const handleAddEmoji = (emoji: string) => {
    const sticker: StorySticker = {
      id: crypto.randomUUID(),
      type: 'emoji',
      content: emoji,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
    }
    onUpdate({ stickers: [...(draft.stickers || []), sticker] })
  }

  return (
    <div className="p-4 max-h-[200px] overflow-y-auto">
      <p className="text-xs font-medium text-text-secondary mb-3">Tap to add</p>
      <div className="grid grid-cols-8 gap-2">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleAddEmoji(emoji)}
            className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-bg-tertiary text-xl transition-colors"
            aria-label={`Add ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

function StyleTab({ draft, onUpdate }: { draft: StoryDraft; onUpdate: (u: Partial<StoryDraft>) => void }) {
  return (
    <div className="p-4 max-h-[200px] overflow-y-auto space-y-4">
      <div>
        <p className="text-xs font-medium text-text-secondary mb-2">Text Color</p>
        <div className="flex gap-2">
          {['#FFFFFF', '#000000', '#0D9488', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#059669'].map((color) => (
            <button
              key={color}
              onClick={() => onUpdate({ textColor: color })}
              className={cn(
                'h-8 w-8 rounded-full border-2 transition-all',
                draft.textColor === color ? 'border-accent scale-110' : 'border-border'
              )}
              style={{ backgroundColor: color }}
              aria-label={`Text color ${color}`}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-text-secondary mb-2">Font Style</p>
        <div className="flex gap-2">
          {(['sans', 'serif', 'mono', 'display'] as const).map((font) => (
            <button
              key={font}
              onClick={() => onUpdate({ fontStyle: font })}
              className={cn(
                'px-3 py-1.5 rounded-xl text-sm border-2 transition-all capitalize',
                draft.fontStyle === font
                  ? 'border-accent bg-accent/10 text-accent font-medium'
                  : 'border-border text-text-secondary hover:border-border-strong'
              )}
            >
              {font}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function StoryPreview({ draft, user, onClose, onPost, posting }: {
  draft: StoryDraft
  user: any
  onClose: () => void
  onPost: () => void
  posting: boolean
}) {
  return (
    <div className="fixed inset-0 z-modal bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onClose} className="p-2 rounded-full bg-white/10 text-white" aria-label="Back to editor">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Button size="sm" loading={posting} onClick={onPost} disabled={posting}>
          <Send className="h-4 w-4 mr-1" />
          Post
        </Button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-[360px] aspect-[9/16] rounded-2xl overflow-hidden flex items-center justify-center"
          style={getStyleForDraft(draft)}
        >
          {draft.mediaPreview && (
            <img
              src={draft.mediaPreview}
              alt="Story preview"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: draft.filter }}
            />
          )}
          {(draft.content || (!draft.mediaPreview && draft.backgroundImage)) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p
                className={cn(
                  'text-center px-8 text-2xl font-bold whitespace-pre-wrap break-words',
                  getFontClass(draft.fontStyle)
                )}
                style={{ color: draft.textColor }}
              >
                {draft.content || ''}
              </p>
            </div>
          )}
          {draft.stickers?.map((s) => (
            <div
              key={s.id}
              className="absolute text-4xl"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                transform: `translate(-50%, -50%) scale(${s.scale}) rotate(${s.rotation}deg)`,
              }}
            >
              {s.content}
            </div>
          ))}
          {draft.musicUrl && (
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
              <Music className="h-4 w-4 text-white" />
              <span className="text-xs text-white truncate">{draft.musicTitle || 'Music'}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 px-4 pb-4">
        <Avatar src={user?.avatar} alt={user?.name} size="sm" />
        <span className="text-sm text-white font-medium">{user?.name || 'You'}</span>
      </div>
    </div>
  )
}

function getStyleForDraft(draft: StoryDraft): React.CSSProperties {
  if (draft.backgroundImage) {
    return { background: draft.backgroundImage }
  }
  return { background: '#0A0A0B' }
}

function getFontClass(fontStyle?: string): string {
  switch (fontStyle) {
    case 'serif': return 'font-serif'
    case 'mono': return 'font-mono'
    case 'display': return 'font-sans font-black tracking-tight text-3xl'
    default: return 'font-sans'
  }
}

function getYouTubeEmbedUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return `https://www.youtube.com/embed/${match[1]}`
  }
  return null
}

async function fetchYouTubeTitle(url: string): Promise<string> {
  try {
    const embedUrl = getYouTubeEmbedUrl(url)
    if (!embedUrl) return 'Audio'
    const videoId = embedUrl.split('/').pop()
    const resp = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
    const data = await resp.json()
    return data.title || 'YouTube video'
  } catch {
    return 'YouTube video'
  }
}
