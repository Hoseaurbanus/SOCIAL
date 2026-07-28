export const BACKGROUND_PRESETS = [
  { name: 'Ocean', value: 'linear-gradient(135deg, #0D9488, #065F46)', type: 'gradient' as const },
  { name: 'Sunset', value: 'linear-gradient(135deg, #F59E0B, #EF4444)', type: 'gradient' as const },
  { name: 'Purple', value: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', type: 'gradient' as const },
  { name: 'Pink', value: 'linear-gradient(135deg, #EC4899, #BE185D)', type: 'gradient' as const },
  { name: 'Midnight', value: 'linear-gradient(135deg, #1E1B4B, #312E81)', type: 'gradient' as const },
  { name: 'Forest', value: 'linear-gradient(135deg, #059669, #065F46)', type: 'gradient' as const },
  { name: 'Peach', value: 'linear-gradient(135deg, #FB923C, #F97316)', type: 'gradient' as const },
  { name: 'Ice', value: 'linear-gradient(135deg, #67E8F9, #06B6D4)', type: 'gradient' as const },
  { name: 'Rose', value: 'linear-gradient(135deg, #FDA4AF, #F43F5E)', type: 'gradient' as const },
  { name: 'Slate', value: 'linear-gradient(135deg, #475569, #1E293B)', type: 'gradient' as const },
  { name: 'Amber', value: 'linear-gradient(135deg, #FCD34D, #F59E0B)', type: 'gradient' as const },
  { name: 'Sky', value: 'linear-gradient(135deg, #7DD3FC, #0EA5E9)', type: 'gradient' as const },
  { name: 'Black', value: '#0A0A0B', type: 'solid' as const },
  { name: 'White', value: '#FFFFFF', type: 'solid' as const },
  { name: 'Teal', value: '#0D9488', type: 'solid' as const },
  { name: 'Amber Solid', value: '#F59E0B', type: 'solid' as const },
]

export const FONT_STYLES = [
  { id: 'sans', label: 'Sans', className: 'font-sans' },
  { id: 'serif', label: 'Serif', className: 'font-serif' },
  { id: 'mono', label: 'Mono', className: 'font-mono' },
  { id: 'display', label: 'Display', className: 'font-sans font-black tracking-tight' },
] as const

export const TEXT_COLORS = [
  '#FFFFFF', '#000000', '#0D9488', '#F59E0B',
  '#EF4444', '#8B5CF6', '#EC4899', '#059669',
]

export const IMAGE_FILTERS = [
  { name: 'Original', filter: 'none' },
  { name: 'Warm', filter: 'sepia(0.3) saturate(1.4) brightness(1.05)' },
  { name: 'Cool', filter: 'saturate(0.8) hue-rotate(20deg) brightness(1.05)' },
  { name: 'B&W', filter: 'grayscale(1) contrast(1.1)' },
  { name: 'Vintage', filter: 'sepia(0.5) contrast(0.9) brightness(1.1)' },
  { name: 'Vibrant', filter: 'saturate(1.8) contrast(1.1) brightness(1.05)' },
]
