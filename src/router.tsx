import { createBrowserRouter } from 'react-router'
import { AuthLayout } from './components/templates/auth-layout'
import { AppLayout } from './components/templates/app-layout'
import { ProtectedRoute } from './components/protected-route'
import { lazy, Suspense } from 'react'

function SuspenseLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
    </div>
  )
}

const LoginPage = lazy(() => import('./pages/auth/login'))
const SignupPage = lazy(() => import('./pages/auth/signup'))
const WelcomePage = lazy(() => import('./pages/auth/welcome'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/forgot-password'))
const VerifyPage = lazy(() => import('./pages/auth/verify'))
const CreatePasswordPage = lazy(() => import('./pages/auth/create-password'))
const ResetPasswordPage = lazy(() => import('./pages/auth/reset-password'))
const OnboardingPage = lazy(() => import('./pages/auth/onboarding'))
const HomePage = lazy(() => import('./pages/core/home'))
const DiscoverPage = lazy(() => import('./pages/core/discover'))
const MessagesPage = lazy(() => import('./pages/core/messages'))
const NotificationsPage = lazy(() => import('./pages/core/notifications'))
const ProfilePage = lazy(() => import('./pages/core/profile'))
const ConversationPage = lazy(() => import('./pages/core/conversation'))
const SettingsPage = lazy(() => import('./pages/social/settings'))
const PrivacyPage = lazy(() => import('./pages/social/privacy'))
const SecurityPage = lazy(() => import('./pages/social/security'))
const AccountSettingsPage = lazy(() => import('./pages/social/account-settings'))
const NotificationSettingsPage = lazy(() => import('./pages/social/notification-settings'))
const AppearanceSettingsPage = lazy(() => import('./pages/social/appearance-settings'))
const HelpPage = lazy(() => import('./pages/social/help'))
const NotFoundPage = lazy(() => import('./pages/errors/not-found'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { index: true, element: <Suspense fallback={<SuspenseLoader />}><WelcomePage /></Suspense> },
      { path: 'login', element: <Suspense fallback={<SuspenseLoader />}><LoginPage /></Suspense> },
      { path: 'signup', element: <Suspense fallback={<SuspenseLoader />}><SignupPage /></Suspense> },
      { path: 'forgot-password', element: <Suspense fallback={<SuspenseLoader />}><ForgotPasswordPage /></Suspense> },
      { path: 'verify', element: <Suspense fallback={<SuspenseLoader />}><VerifyPage /></Suspense> },
      { path: 'create-password', element: <Suspense fallback={<SuspenseLoader />}><CreatePasswordPage /></Suspense> },
      { path: 'reset-password', element: <Suspense fallback={<SuspenseLoader />}><ResetPasswordPage /></Suspense> },
    ],
  },
  {
    path: '/onboarding',
    element: <Suspense fallback={<SuspenseLoader />}><OnboardingPage /></Suspense>,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: 'home', element: <Suspense fallback={<SuspenseLoader />}><HomePage /></Suspense> },
          { path: 'discover', element: <Suspense fallback={<SuspenseLoader />}><DiscoverPage /></Suspense> },
          { path: 'messages', element: <Suspense fallback={<SuspenseLoader />}><MessagesPage /></Suspense> },
          { path: 'messages/:conversationId', element: <Suspense fallback={<SuspenseLoader />}><ConversationPage /></Suspense> },
          { path: 'notifications', element: <Suspense fallback={<SuspenseLoader />}><NotificationsPage /></Suspense> },
          { path: 'profile/:username?', element: <Suspense fallback={<SuspenseLoader />}><ProfilePage /></Suspense> },
          { path: 'settings', element: <Suspense fallback={<SuspenseLoader />}><SettingsPage /></Suspense> },
          { path: 'settings/privacy', element: <Suspense fallback={<SuspenseLoader />}><PrivacyPage /></Suspense> },
          { path: 'settings/security', element: <Suspense fallback={<SuspenseLoader />}><SecurityPage /></Suspense> },
          { path: 'settings/account', element: <Suspense fallback={<SuspenseLoader />}><AccountSettingsPage /></Suspense> },
          { path: 'settings/notifications', element: <Suspense fallback={<SuspenseLoader />}><NotificationSettingsPage /></Suspense> },
          { path: 'settings/appearance', element: <Suspense fallback={<SuspenseLoader />}><AppearanceSettingsPage /></Suspense> },
          { path: 'settings/help', element: <Suspense fallback={<SuspenseLoader />}><HelpPage /></Suspense> },
        ],
      },
    ],
  },
  { path: '*', element: <Suspense fallback={<SuspenseLoader />}><NotFoundPage /></Suspense> },
])
