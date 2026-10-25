import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

type Toast = {
  id: string
  message: string
  tone: ToastTone
}

type ToastContextValue = {
  toasts: Toast[]
  notify: (message: string, tone?: ToastTone) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const notify = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, message, tone }])
      window.setTimeout(() => dismiss(id), 3200)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toasts, notify, dismiss }), [toasts, notify, dismiss])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
