import { useNavigate } from 'react-router'
import { ChevronLeft, ChevronRight, Lock, Smartphone, Key } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '@/config/supabase'
import { cn } from '@/lib/utils'

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
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChangePassword = async () => {
    setError('')
    setSuccess('')
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setIsLoading(true)
    try {
      const { error: authError } = await supabase.auth.updateUser({ password: newPassword })
      if (authError) throw authError
      setSuccess('Password updated successfully')
      setShowPasswordForm(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e: any) {
      setError(e.message || 'Failed to update password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-bg-tertiary text-text-secondary">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-text-primary">Security</h1>
      </div>

      <div className="bg-bg-primary divide-y divide-border">
        <SecurityItem icon={<Lock className="h-5 w-5" />} label="Change Password" description="Update your password regularly" onClick={() => setShowPasswordForm(!showPasswordForm)} />
        {showPasswordForm && (
          <div className="px-4 py-4 space-y-3">
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {error && <div className="text-sm text-red-500">{error}</div>}
            {success && <div className="text-sm text-green-500">{success}</div>}
            <div className="flex gap-2">
              <button
                onClick={handleChangePassword}
                disabled={isLoading}
                className={cn(
                  'px-4 py-2 bg-accent text-white rounded-lg font-medium',
                  isLoading && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </button>
              <button
                onClick={() => {
                  setShowPasswordForm(false)
                  setError('')
                  setSuccess('')
                }}
                className="px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <SecurityItem icon={<Smartphone className="h-5 w-5" />} label="Two-Factor Authentication" description="Coming soon" onClick={() => {}} />
        <SecurityItem icon={<Key className="h-5 w-5" />} label="Active Sessions" description="Coming soon" onClick={() => {}} />
      </div>
    </div>
  )
}
