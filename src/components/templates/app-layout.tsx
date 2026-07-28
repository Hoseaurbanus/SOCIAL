import { Outlet } from 'react-router'
import { Header } from '@/components/organisms/header'
import { BottomNav } from '@/components/organisms/bottom-nav'
import { PwaInstallBanner } from '@/components/molecules/pwa-install-banner'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-bg-secondary">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Header />
      <main id="main-content" className="pt-16 pb-24 md:pb-4" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 96px)' }}>
        <div className="max-w-[600px] mx-auto">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <PwaInstallBanner />
    </div>
  )
}
