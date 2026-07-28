import { useNavigate } from 'react-router'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, User, Shield, Lock, Bell, Sparkles, Palette, HelpCircle, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

interface SettingsItemProps {
  icon: React.ReactNode
  label: string
  description: string
  onClick?: () => void
  disabled?: boolean
}

function SettingsItem({ icon, label, description, onClick, disabled }: SettingsItemProps) {
  return (
    <button onClick={onClick} disabled={disabled} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-tertiary transition-colors text-left border-b border-border disabled:opacity-50 disabled:cursor-not-allowed">
      <div className="text-text-secondary">{icon}</div>
      <div className="flex-1">
        <div className="text-text-primary">{label}</div>
        <div className="text-sm text-text-secondary">{description}</div>
      </div>
      <ChevronRight className="h-5 w-5 text-text-tertiary" />
    </button>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    navigate('/login')
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-bg-tertiary text-text-secondary">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-text-primary">Settings</h1>
      </div>

      <div className="bg-bg-primary">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Account</h3>
        </div>
        <SettingsItem icon={<User className="h-5 w-5" />} label="Account" description="Name, email, username" onClick={() => navigate('/settings/account')} />

        <div className="px-4 pt-4 pb-2">
          <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Privacy</h3>
        </div>
        <SettingsItem icon={<Shield className="h-5 w-5" />} label="Privacy" description="Who can see your content" onClick={() => navigate('/settings/privacy')} />

        <div className="px-4 pt-4 pb-2">
          <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Security</h3>
        </div>
        <SettingsItem icon={<Lock className="h-5 w-5" />} label="Security" description="Password, 2FA, devices" onClick={() => navigate('/settings/security')} />

        <div className="px-4 pt-4 pb-2">
          <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Preferences</h3>
        </div>
        <SettingsItem icon={<Bell className="h-5 w-5" />} label="Notifications" description="Push, email, in-app" onClick={() => navigate('/settings/notifications')} />
        <SettingsItem icon={<Sparkles className="h-5 w-5" />} label="AI Settings" description="Content recommendations" disabled />
        <SettingsItem icon={<Palette className="h-5 w-5" />} label="Appearance" description="Theme, display" onClick={() => navigate('/settings/appearance')} />

        <div className="px-4 pt-4 pb-2">
          <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Support</h3>
        </div>
        <SettingsItem icon={<HelpCircle className="h-5 w-5" />} label="Help & Support" description="FAQ, contact us" onClick={() => navigate('/settings/help')} />
        <SettingsItem icon={<LogOut className="h-5 w-5" />} label="Log Out" description="Sign out of your account" onClick={handleLogout} disabled={loggingOut} />
      </div>
    </div>
  )
}
