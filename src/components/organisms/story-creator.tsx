import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Type, Image, Music, Smile, Palette, ArrowLeft, Eye, Send, Trash2, Plus, ChevronUp } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Avatar } from '@/components/atoms/avatar'
import { cn } from '@/lib/utils'
import { BACKGROUND_PRESETS, FONT_STYLES, TEXT_COLORS } from '@/lib/story-presets'
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
  audience?: 'public' | 'followers'
}

const toolGroups = [
  { id: 'text', label: 'Text', icon: Type },
  { id: 'upload', label: 'Upload', icon: Image },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'stickers', label: 'Stickers', icon: Smile },
  { id: 'style', label: 'Style', icon: Palette },
]

export function StoryCreator({ isOpen, onClose, onPost }: StoryCreatorProps) {
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [draft, setDraft] = useState<StoryDraft>({
    mode: 'text',
    textColor: '#FFFFFF',
    fontStyle: 'sans',
    filter: 'none',
  })
  const [posting, setPosting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore((s) => s.user)
  const toast = useToast((s) => s.toast)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const draftKey = 'smugflex-story-draft'

  const updateDraft = useCallback((updates: Partial<StoryDraft>) => {
    setDraft((prev) => ({ ...prev, ...updates }))
  }, [])

  // Draft persistence
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(draftKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        setDraft((prev) => ({ ...prev, ...parsed, mediaFile: undefined, mediaPreview: undefined }))
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      const toSave = { ...draft, mediaFile: undefined, mediaPreview: undefined }
      sessionStorage.setItem(draftKey, JSON.stringify(toSave))
    } catch {}
  }, [draft])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isVideo = file.type.startsWith('video/')
    updateDraft({
      mode: isVideo ? 'video' : 'image',
      mediaFile: file,
      mediaPreview: URL.createObjectURL(file),
    })
    setActiveTool(null)
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
      sessionStorage.removeItem(draftKey)
      setDraft({ mode: 'text', textColor: '#FFFFFF', fontStyle: 'sans', filter: 'none', audience: 'public' })
      onClose()
    } catch (err: any) {
      const msg = err?.message || err?.error?.message || 'Failed to post story'
      toast({ title: msg, variant: 'error' })
    } finally {
      setPosting(false)
    }
  }

  // Sticker drag handlers
  const handleStickerMouseDown = useCallback((e: React.MouseEvent, sticker: StorySticker) => {
    e.stopPropagation()
    setSelectedStickerId(sticker.id)
    const startX = e.clientX
    const startY = e.clientY
    const startStickerX = sticker.x
    const startStickerY = sticker.y

    const handleMouseMove = (ev: MouseEvent) => {
      if (!previewRef.current) return
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      const rect = previewRef.current.getBoundingClientRect()
      const newX = Math.max(0, Math.min(100, startStickerX + (dx / rect.width) * 100))
      const newY = Math.max(0, Math.min(100, startStickerY + (dy / rect.height) * 100))
      setDraft((prev) => ({
        ...prev,
        stickers: prev.stickers?.map((s) => s.id === sticker.id ? { ...s, x: newX, y: newY } : s),
      }))
    }

    const handleMouseUp = () => {
      setSelectedStickerId(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [])

  if (!isOpen) return null

  if (showPreview) {
    return (
      <StoryPreview draft={draft} user={user} onClose={() => setShowPreview(false)} onPost={handlePost} posting={posting} />
    )
  }

  return (
    <motion.div
      className="fixed inset-0 z-modal bg-bg-primary flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Create story"
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <motion.div
        className="flex items-center justify-between px-4 py-3 border-b border-border"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <motion.button onClick={onClose} className="p-2 rounded-full hover:bg-bg-tertiary text-text-secondary" whileTap={{ scale: 0.85 }} aria-label="Close">
          <X className="h-5 w-5" />
        </motion.button>
        <h2 className="text-base font-semibold text-text-primary">New Story</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDraft((prev) => ({ ...prev, audience: prev.audience === 'followers' ? 'public' : 'followers' }))}
            className="px-3 py-1.5 text-xs font-medium rounded-full border transition-colors"
            style={{
              borderColor: draft.audience === 'followers' ? 'var(--color-accent)' : 'var(--color-border)',
              backgroundColor: draft.audience === 'followers' ? 'var(--color-accent-light)' : 'transparent',
              color: draft.audience === 'followers' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            }}
          >
            {draft.audience === 'followers' ? 'Followers' : 'Public'}
          </button>
          <Button variant="ghost" size="sm" onClick={() => setShowPreview(true)} disabled={draft.mode === 'text' && !draft.backgroundImage} aria-label="Preview">
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button size="sm" loading={posting} onClick={handlePost} disabled={posting || (draft.mode === 'text' && !draft.backgroundImage)}>
            <Send className="h-4 w-4 mr-1" />
            Post
          </Button>
        </div>
      </motion.div>

      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <motion.div
          ref={previewRef}
          className="relative w-full max-w-[360px] aspect-[9/16] rounded-3xl overflow-hidden flex items-center justify-center shadow-2xl"
          style={getStyleForDraft(draft)}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
        >
          {draft.mode === 'text' && draft.backgroundImage && (
            <motion.p
              className={cn('text-center px-8 text-2xl font-bold whitespace-pre-wrap break-words', getFontClass(draft.fontStyle))}
              style={{ color: draft.textColor }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              {draft.content || 'Tap to add text'}
            </motion.p>
          )}
          {draft.mode === 'text' && !draft.backgroundImage && (
            <div className="text-center px-8 text-white/40">
              <Type className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Select a background below</p>
            </div>
          )}
          {draft.mediaPreview && (
            <img src={draft.mediaPreview} alt="Story preview" className="absolute inset-0 w-full h-full object-cover" style={{ filter: draft.filter }} />
          )}
          {draft.mediaPreview && draft.content && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className={cn('text-center px-8 text-2xl font-bold whitespace-pre-wrap break-words drop-shadow-lg', getFontClass(draft.fontStyle))} style={{ color: draft.textColor }}>
                {draft.content}
              </p>
            </div>
          )}

          {/* Stickers */}
          {draft.stickers && draft.stickers.map((s) => (
            <div
              key={s.id}
              className={cn(
                'absolute text-4xl cursor-move select-none touch-none',
                selectedStickerId === s.id && 'ring-2 ring-accent rounded-lg scale-110'
              )}
              style={{ left: `${s.x}%`, top: `${s.y}%`, transform: `translate(-50%, -50%) scale(${s.scale}) rotate(${s.rotation}deg)` }}
              onMouseDown={(e) => handleStickerMouseDown(e, s)}
            >
              {s.content}
              {selectedStickerId === s.id && (
                <button onClick={(e) => { e.stopPropagation(); updateDraft({ stickers: draft.stickers?.filter((st) => st.id !== s.id) }) }} className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-error flex items-center justify-center" aria-label="Remove sticker">
                  <Trash2 className="h-3 w-3 text-white" />
                </button>
              )}
            </div>
          ))}

          {/* Text overlays */}
          {draft.textOverlays && draft.textOverlays.map((o) => (
            <div key={o.id} className="absolute pointer-events-none" style={{ left: `${o.x}%`, top: `${o.y}%`, transform: 'translate(-50%, -50%)', color: o.color, fontSize: `${o.fontSize}px`, fontWeight: o.fontWeight }}>
              {o.text}
            </div>
          ))}

          {/* Music indicator */}
          {draft.musicUrl && (
            <motion.div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-4 py-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Music className="h-4 w-4 text-white" />
              <span className="text-xs text-white truncate">{draft.musicTitle || 'Music'}</span>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Content Input */}
      <div className="px-4 pb-2">
        <textarea
          value={draft.content || ''}
          onChange={(e) => updateDraft({ content: e.target.value })}
          placeholder="Add text to your story..."
          rows={2}
          maxLength={200}
          className="w-full bg-bg-secondary border-2 border-border rounded-2xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-0 resize-none"
          aria-label="Story text"
        />
        <p className="text-xs text-text-tertiary text-right mt-1">{(draft.content || '').length}/200</p>
      </div>

      {/* Tool Bar — Bottom Sheet Trigger */}
      <div className="px-4 pb-2">
        <motion.button
          onClick={() => setActiveTool(activeTool ? null : 'text')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-bg-secondary border border-border text-sm text-text-secondary"
          whileTap={{ scale: 0.97 }}
        >
          <ChevronUp className={cn('h-4 w-4 transition-transform', activeTool && 'rotate-180')} />
          {activeTool ? 'Close tools' : 'Open tools'}
        </motion.button>
      </div>

      {/* Tool Bar */}
      <div className="flex gap-1 px-4 pb-2">
        {toolGroups.map((tool) => (
          <motion.button
            key={tool.id}
            onClick={() => {
              if (tool.id === 'upload') { fileInputRef.current?.click() }
              else { setActiveTool(activeTool === tool.id ? null : tool.id) }
            }}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-semibold rounded-xl transition-colors',
              activeTool === tool.id
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
            )}
            whileTap={{ scale: 0.92 }}
            aria-label={tool.label}
          >
            <tool.icon className="h-5 w-5" />
            {tool.label}
          </motion.button>
        ))}
      </div>

      {/* Tool Content Panel */}
      <AnimatePresence>
        {activeTool && (
          <motion.div
            className="border-t border-border bg-bg-secondary overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="max-h-[220px] overflow-y-auto">
              {activeTool === 'text' && <TextTab draft={draft} onUpdate={updateDraft} />}
              {activeTool === 'music' && <MusicTab draft={draft} onUpdate={updateDraft} />}
              {activeTool === 'stickers' && <StickersTab draft={draft} onUpdate={updateDraft} />}
              {activeTool === 'style' && <StyleTab draft={draft} onUpdate={updateDraft} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
    </motion.div>
  )
}

// ===== Tool Tabs =====

function TextTab({ draft, onUpdate }: { draft: StoryDraft; onUpdate: (u: Partial<StoryDraft>) => void }) {
  return (
    <div className="p-4">
      <p className="text-xs font-medium text-text-secondary mb-3">Background</p>
      <div className="grid grid-cols-8 gap-2">
        {BACKGROUND_PRESETS.map((preset) => (
          <motion.button
            key={preset.name}
            onClick={() => onUpdate({ backgroundImage: preset.value })}
            className={cn('h-10 w-10 rounded-xl border-2 transition-colors', draft.backgroundImage === preset.value ? 'border-accent shadow-lg' : 'border-transparent')}
            style={{ background: preset.value }}
            whileTap={{ scale: 0.9 }}
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
    } finally { setLoading(false) }
  }

  return (
    <div className="p-4">
      {draft.musicUrl ? (
        <div className="flex items-center gap-3 p-3 bg-bg-primary rounded-2xl border border-border">
          <Music className="h-5 w-5 text-accent flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{draft.musicTitle}</p>
          </div>
          <motion.button onClick={() => onUpdate({ musicUrl: undefined, musicTitle: undefined })} className="p-1 rounded-full hover:bg-bg-tertiary text-text-secondary" whileTap={{ scale: 0.85 }}>
            <X className="h-4 w-4" />
          </motion.button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste YouTube or audio URL..." className="flex-1 h-10 px-4 rounded-2xl border-2 border-border bg-bg-primary text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-0" />
          <Button size="sm" onClick={handleAdd} loading={loading} disabled={!url.trim()}>Add</Button>
        </div>
      )}
    </div>
  )
}

function StickersTab({ draft, onUpdate }: { draft: StoryDraft; onUpdate: (u: Partial<StoryDraft>) => void }) {
  const emojis = ['😀','😂','😍','🥺','🔥','✨','🎉','❤️','👍','💀','🤔','😎','🥳','😭','🙌','💪','🎵','🌟','💡','🎯','🚀','💎','🌈','🦋']

  return (
    <div className="p-4">
      <p className="text-xs font-medium text-text-secondary mb-3">Tap to add — drag to reposition</p>
      <div className="grid grid-cols-8 gap-2">
        {emojis.map((emoji) => (
          <motion.button
            key={emoji}
            onClick={() => {
              const sticker: StorySticker = { id: crypto.randomUUID(), type: 'emoji', content: emoji, x: 50, y: 50, scale: 1, rotation: 0 }
              onUpdate({ stickers: [...(draft.stickers || []), sticker] })
            }}
            className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-bg-tertiary text-xl"
            whileTap={{ scale: 1.3 }}
            aria-label={`Add ${emoji}`}
          >
            {emoji}
          </motion.button>
        ))}
      </div>
      {draft.stickers && draft.stickers.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs font-medium text-text-secondary mb-2">Added ({draft.stickers.length})</p>
          <div className="flex flex-wrap gap-2">
            {draft.stickers.map((s) => (
              <motion.button
                key={s.id}
                onClick={() => onUpdate({ stickers: draft.stickers?.filter((st) => st.id !== s.id) })}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-bg-primary border border-border hover:border-error text-xl"
                whileTap={{ scale: 0.85 }}
                aria-label={`Remove ${s.content}`}
              >
                {s.content}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StyleTab({ draft, onUpdate }: { draft: StoryDraft; onUpdate: (u: Partial<StoryDraft>) => void }) {
  return (
    <div className="p-4 space-y-4">
      <div>
        <p className="text-xs font-medium text-text-secondary mb-2">Text Color</p>
        <div className="flex gap-2">
          {TEXT_COLORS.map((color) => (
            <motion.button
              key={color}
              onClick={() => onUpdate({ textColor: color })}
              className={cn('h-8 w-8 rounded-full border-2', draft.textColor === color ? 'border-accent ring-2 ring-accent/30' : 'border-border')}
              style={{ backgroundColor: color }}
              whileTap={{ scale: 0.85 }}
              aria-label={`Text color ${color}`}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-text-secondary mb-2">Font Style</p>
        <div className="flex gap-2">
          {FONT_STYLES.map((font) => (
            <motion.button
              key={font.id}
              onClick={() => onUpdate({ fontStyle: font.id })}
              className={cn('px-3 py-1.5 rounded-xl text-sm border-2', draft.fontStyle === font.id ? 'border-accent bg-accent/10 text-accent font-medium' : 'border-border text-text-secondary')}
              whileTap={{ scale: 0.92 }}
            >
              <span className={font.className}>{font.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-text-secondary">Text Overlays</p>
          <motion.button
            onClick={() => {
              const overlay: import('@/types/api').TextOverlay = { id: crypto.randomUUID(), text: 'Text', x: 50, y: 50, color: draft.textColor || '#FFFFFF', fontSize: 24, fontWeight: 'bold' }
              onUpdate({ textOverlays: [...(draft.textOverlays || []), overlay] })
            }}
            className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover"
            whileTap={{ scale: 0.9 }}
          >
            <Plus className="h-3 w-3" /> Add
          </motion.button>
        </div>
        {draft.textOverlays && draft.textOverlays.length > 0 ? (
          <div className="space-y-2">
            {draft.textOverlays.map((overlay) => (
              <div key={overlay.id} className="flex items-center gap-2">
                <input type="text" value={overlay.text} onChange={(e) => onUpdate({ textOverlays: draft.textOverlays?.map((o) => o.id === overlay.id ? { ...o, text: e.target.value } : o) })} className="flex-1 h-8 px-3 rounded-xl border-2 border-border bg-bg-primary text-sm text-text-primary focus:border-accent focus:ring-0" />
                <input type="number" value={overlay.fontSize} onChange={(e) => onUpdate({ textOverlays: draft.textOverlays?.map((o) => o.id === overlay.id ? { ...o, fontSize: parseInt(e.target.value) || 24 } : o) })} className="w-16 h-8 px-2 rounded-xl border-2 border-border bg-bg-primary text-sm text-text-primary text-center focus:border-accent focus:ring-0" min={12} max={72} />
                <motion.button onClick={() => onUpdate({ textOverlays: draft.textOverlays?.filter((o) => o.id !== overlay.id) })} className="p-1.5 rounded-full hover:bg-error-light text-error" whileTap={{ scale: 0.85 }} aria-label="Remove">
                  <Trash2 className="h-4 w-4" />
                </motion.button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-tertiary">No overlays added</p>
        )}
      </div>
    </div>
  )
}

// ===== Story Preview =====

function StoryPreview({ draft, user, onClose, onPost, posting }: { draft: StoryDraft; user: any; onClose: () => void; onPost: () => void; posting: boolean }) {
  return (
    <motion.div
      className="fixed inset-0 z-modal bg-black flex flex-col"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <motion.button onClick={onClose} className="p-2 rounded-full bg-white/10 text-white" whileTap={{ scale: 0.85 }} aria-label="Back to editor">
          <ArrowLeft className="h-5 w-5" />
        </motion.button>
        <Button size="sm" loading={posting} onClick={onPost} disabled={posting}>
          <Send className="h-4 w-4 mr-1" /> Post
        </Button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-[360px] aspect-[9/16] rounded-3xl overflow-hidden flex items-center justify-center" style={getStyleForDraft(draft)}>
          {draft.mediaPreview && <img src={draft.mediaPreview} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: draft.filter }} />}
          {(draft.content || (!draft.mediaPreview && draft.backgroundImage)) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className={cn('text-center px-8 text-2xl font-bold whitespace-pre-wrap break-words', getFontClass(draft.fontStyle))} style={{ color: draft.textColor }}>{draft.content || ''}</p>
            </div>
          )}
          {draft.stickers?.map((s) => (
            <div key={s.id} className="absolute text-4xl" style={{ left: `${s.x}%`, top: `${s.y}%`, transform: `translate(-50%, -50%) scale(${s.scale}) rotate(${s.rotation}deg)` }}>{s.content}</div>
          ))}
          {draft.textOverlays?.map((o) => (
            <div key={o.id} className="absolute pointer-events-none" style={{ left: `${o.x}%`, top: `${o.y}%`, transform: 'translate(-50%, -50%)', color: o.color, fontSize: `${o.fontSize}px`, fontWeight: o.fontWeight }}>{o.text}</div>
          ))}
          {draft.musicUrl && (
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-4 py-2">
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
    </motion.div>
  )
}

// ===== Helpers =====

function getStyleForDraft(draft: StoryDraft): React.CSSProperties {
  if (draft.backgroundImage) return { background: draft.backgroundImage }
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
  const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/]
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
