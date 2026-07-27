import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/api'
import { supabase } from '@/config/supabase'
import type { Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  pendingVerification: { identifier: string; type: 'email' | 'phone' } | null
  setSession: (session: Session | null, profile?: User | null) => void
  login: (email: string, password: string) => Promise<{ error?: string }>
  signup: (email: string, password: string, name: string) => Promise<{ error?: string; needsVerification?: boolean }>
  signupWithPhone: (phone: string, password: string, name: string) => Promise<{ error?: string; needsVerification?: boolean }>
  verifyOtp: (identifier: string, token: string, type: 'email' | 'phone') => Promise<{ error?: string }>
  resendOtp: (identifier: string, type: 'email' | 'phone') => Promise<{ error?: string }>
  loginWithGoogle: () => Promise<{ error?: string }>
  logout: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
  initialize: () => Promise<void>
}

function buildProfile(user: any): User {
  return {
    id: user.id,
    email: user.email || '',
    phone: user.phone || '',
    name: user.user_metadata?.name || user.email?.split('@')[0] || user.phone || '',
    username: user.user_metadata?.username || user.email?.split('@')[0] || user.phone || '',
    avatar: user.user_metadata?.avatar,
    isPrivate: false,
    createdAt: user.created_at,
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      pendingVerification: null,

      setSession: (session, profile) => {
        if (session && profile) {
          set({
            user: profile,
            token: session.access_token,
            isAuthenticated: true,
            isLoading: false,
            pendingVerification: null,
          })
        } else {
          set({ user: null, token: null, isAuthenticated: false, isLoading: false })
        }
      },

      login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return { error: error.message }

        if (data.user) {
          set({
            user: buildProfile(data.user),
            token: data.session.access_token,
            isAuthenticated: true,
            isLoading: false,
          })
        }
        return {}
      },

      signup: async (email, password, name) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, username: name.toLowerCase().replace(/\s+/g, '') },
          },
        })
        if (error) return { error: error.message }

        if (data.user) {
          const emailConfirmed = data.user.email_confirmed_at != null
          if (emailConfirmed && data.session) {
            set({
              user: buildProfile(data.user),
              token: data.session.access_token,
              isAuthenticated: true,
              isLoading: false,
            })
            return {}
          }

          // Send OTP email after signup
          await supabase.auth.signInWithOtp({ email })

          set({ pendingVerification: { identifier: email, type: 'email' } })
          return { needsVerification: true }
        }
        return {}
      },

      signupWithPhone: async (phone, password, name) => {
        const { data, error } = await supabase.auth.signUp({
          phone,
          password,
          options: {
            data: { name, username: name.toLowerCase().replace(/\s+/g, '') },
          },
        })
        if (error) return { error: error.message }

        if (data.user) {
          const phoneConfirmed = data.user.phone_confirmed_at != null
          if (phoneConfirmed && data.session) {
            set({
              user: buildProfile(data.user),
              token: data.session.access_token,
              isAuthenticated: true,
              isLoading: false,
            })
            return {}
          }
          set({ pendingVerification: { identifier: phone, type: 'phone' } })
          return { needsVerification: true }
        }
        return {}
      },

      verifyOtp: async (identifier, token, type) => {
        const method = type === 'email' ? 'signup' : 'sms'
        const { data, error } = await supabase.auth.verifyOtp({
          [type]: identifier,
          token,
          type: method,
        } as any)
        if (error) return { error: error.message }

        if (data.session && data.user) {
          set({
            user: buildProfile(data.user),
            token: data.session.access_token,
            isAuthenticated: true,
            isLoading: false,
            pendingVerification: null,
          })
        }
        return {}
      },

      resendOtp: async (identifier, type) => {
        const { error } = await supabase.auth.signInWithOtp({
          [type]: identifier,
        } as any)
        if (error) return { error: error.message }
        return {}
      },

      loginWithGoogle: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/home`,
          },
        })
        if (error) return { error: error.message }
        return {}
      },

      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, token: null, isAuthenticated: false, isLoading: false })
      },

      updateUser: (userData) => {
        set((s) => ({ user: s.user ? { ...s.user, ...userData } : null }))
      },

      initialize: async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          set({
            user: buildProfile(session.user),
            token: session.access_token,
            isAuthenticated: true,
            isLoading: false,
          })
        } else {
          set({ isLoading: false })
        }

        supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            set({
              user: buildProfile(session.user),
              token: session.access_token,
              isAuthenticated: true,
              isLoading: false,
              pendingVerification: null,
            })
          } else {
            set({ user: null, token: null, isAuthenticated: false, isLoading: false })
          }
        })
      },
    }),
    {
      name: 'smugflex-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        pendingVerification: state.pendingVerification,
      }),
    }
  )
)
