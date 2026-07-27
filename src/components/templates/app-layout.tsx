import { Outlet } from 'react-router'
import { Header } from '@/components/organisms/header'
import { BottomNav } from '@/components/organisms/bottom-nav'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-bg-secondary">
      <Header />
      <main className="pt-16 pb-20 md:pb-0">
        <div className="max-w-[600px] mx-auto px-4">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
