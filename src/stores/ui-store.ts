import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface UIState {
  theme: Theme
  sidebarOpen: boolean
  commandPaletteOpen: boolean
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  toggleCommandPalette: () => void
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    root.setAttribute('data-theme', theme)
  }
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarOpen: false,
      commandPaletteOpen: false,
      setTheme: (theme) => { set({ theme }); applyTheme(theme) },
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
    }),
    {
      name: 'smugflex-ui',
      onRehydrateStorage: () => (state) => { if (state?.theme) applyTheme(state.theme) },
    }
  )
)
