import { createContext, useCallback, useContext, useState } from 'react'

interface Toast { id: number; message: string; type: 'success' | 'error' | 'info' }
interface ToastCtx { showToast: (msg: string, type?: Toast['type']) => void }

const ToastContext = createContext<ToastCtx | null>(null)
let _id = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++_id
    setToasts((p) => [...p, { id, message, type }])
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000)
  }, [])

  const bg = { success: 'bg-green-700', error: 'bg-red-600', info: 'bg-slate-700' }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[calc(100%-32px)] max-w-[398px]">
        {toasts.map((t) => (
          <div key={t.id} className={`${bg[t.type]} text-white px-4 py-3 rounded-xl shadow-lg text-sm text-center font-medium`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
