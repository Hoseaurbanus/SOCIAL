import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft, Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

type Theme = 'light' | 'dark' | 'system'

const themes: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
]

export default function AppearanceSettingsPage() {
  const navigate = useNavigate()
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system'
  })

  useEffect(() => {
    localStorage.setItem('theme', theme)
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    } else {
      document.documentElement.setAttribute('data-theme', theme)
    }
  }, [theme])

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-bg-tertiary text-text-secondary">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-text-primary">Appearance</h1>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-medium text-text-primary mb-3">Theme</h3>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors',
                  theme === t.id
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:bg-bg-tertiary'
                )}
              >
                <Icon className="h-6 w-6 text-text-primary" />
                <span className="text-sm font-medium text-text-primary">{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
