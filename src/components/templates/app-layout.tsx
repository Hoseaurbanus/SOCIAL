import { Outlet } from 'react-router'
import { Header } from '@/components/organisms/header'
import { BottomNav } from '@/components/organisms/bottom-nav'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-bg-secondary">
      <Header />
      <main className="pt-16 pb-24 md:pb-4">
        <div className="max-w-[600px] mx-auto">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
