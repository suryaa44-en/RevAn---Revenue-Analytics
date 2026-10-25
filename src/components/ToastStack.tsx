import { useToast } from '../store/ToastContext'

export function ToastStack() {
  const { toasts, dismiss } = useToast()
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          className={`toast toast-${toast.tone}`}
          onClick={() => dismiss(toast.id)}
        >
          {toast.message}
        </button>
      ))}
    </div>
  )
}
