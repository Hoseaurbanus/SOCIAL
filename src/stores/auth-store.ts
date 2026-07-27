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
  setSession: (session: Session | null, profile?: User | null) => void
  login: (email: string, password: string) => Promise<{ error?: string }>
  signup: (email: string, password: string, name: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      setSession: (session, profile) => {
        if (session && profile) {
          set({
            user: profile,
            token: session.access_token,
            isAuthenticated: true,
            isLoading: false,
          })
        } else {
          set({ user: null, token: null, isAuthenticated: false, isLoading: false })
        }
      },

      login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return { error: error.message }

        if (data.user) {
          const profile: User = {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || '',
            username: data.user.user_metadata?.username || data.user.email?.split('@')[0] || '',
            avatar: data.user.user_metadata?.avatar,
            isPrivate: false,
            createdAt: data.user.created_at,
          }
          set({
            user: profile,
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

        if (data.user && data.session) {
          const profile: User = {
            id: data.user.id,
            email: data.user.email || '',
            name,
            username: name.toLowerCase().replace(/\s+/g, ''),
            isPrivate: false,
            createdAt: data.user.created_at,
          }
          set({
            user: profile,
            token: data.session.access_token,
            isAuthenticated: true,
            isLoading: false,
          })
        }
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
          const profile: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || '',
            username: session.user.user_metadata?.username || '',
            avatar: session.user.user_metadata?.avatar,
            isPrivate: false,
            createdAt: session.user.created_at,
          }
          set({
            user: profile,
            token: session.access_token,
            isAuthenticated: true,
            isLoading: false,
          })
        } else {
          set({ isLoading: false })
        }

        supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            const profile: User = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || '',
              username: session.user.user_metadata?.username || '',
              avatar: session.user.user_metadata?.avatar,
              isPrivate: false,
              createdAt: session.user.created_at,
            }
            set({
              user: profile,
              token: session.access_token,
              isAuthenticated: true,
              isLoading: false,
            })
          } else {
            set({ user: null, token: null, isAuthenticated: false, isLoading: false })
          }
        })
      },
    }),
    {
      name: 'smugflex-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
)
