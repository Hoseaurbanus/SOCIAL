import { useNavigate } from 'react-router'
import { ChevronLeft, ChevronRight, Lock, Smartphone, Key } from 'lucide-react'

interface SecurityItemProps {
  icon: React.ReactNode
  label: string
  description: string
  onClick?: () => void
}

function SecurityItem({ icon, label, description, onClick }: SecurityItemProps) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-tertiary transition-colors text-left border-b border-border">
      <div className="text-text-secondary">{icon}</div>
      <div className="flex-1">
        <div className="text-text-primary">{label}</div>
        <div className="text-sm text-text-secondary">{description}</div>
      </div>
      <ChevronRight className="h-5 w-5 text-text-tertiary" />
    </button>
  )
}

export default function SecurityPage() {
  const navigate = useNavigate()

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-bg-tertiary text-text-secondary">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-text-primary">Security</h1>
      </div>

      <div className="bg-bg-primary divide-y divide-border">
        <SecurityItem icon={<Lock className="h-5 w-5" />} label="Change Password" description="Last changed 3 months ago" onClick={() => {}} />
        <SecurityItem icon={<Smartphone className="h-5 w-5" />} label="Two-Factor Authentication" description="Add an extra layer of security" onClick={() => {}} />
        <SecurityItem icon={<Key className="h-5 w-5" />} label="Active Sessions" description="2 devices logged in" onClick={() => {}} />
      </div>
    </div>
  )
}
