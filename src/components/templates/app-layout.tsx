import { Outlet } from 'react-router'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-bg-secondary">
      <main className="pt-16 pb-20 md:pb-0">
        <div className="max-w-[1200px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
