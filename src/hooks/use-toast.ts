import { create } from 'zustand'

interface Toast {
  id: string
  title: string
  variant: 'success' | 'error' | 'info'
}

interface ToastStore {
  toasts: Toast[]
  toast: (toast: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

let toastCounter = 0

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  toast: (t) => {
    const id = `toast-${++toastCounter}`
    set((state) => ({ toasts: [...state.toasts, { ...t, id }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((x) => x.id !== id) }))
    }, 3000)
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((x) => x.id !== id) })),
}))
