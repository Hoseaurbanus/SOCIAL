import { Outlet } from 'react-router'

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-secondary">
      <div className="w-full max-w-[400px] p-6">
        <Outlet />
      </div>
    </div>
  )
}
