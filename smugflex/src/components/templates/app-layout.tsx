import { Outlet } from 'react-router'
import { Header } from '../organisms/header'
import { BottomNav } from '../organisms/bottom-nav'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-bg-secondary">
      <Header notificationCount={3} />
      <main className="pt-16 pb-20 md:pb-0">
        <div className="max-w-[1200px] mx-auto">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
