/**
 * ToastContext — глобальные уведомления.
 * useToast().show('Текст', 'success' | 'error' | 'info')
 */

import React, { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const success = useCallback((msg) => show(msg, 'success'), [show])
  const error = useCallback((msg) => show(msg, 'error'), [show])
  const info = useCallback((msg) => show(msg, 'info'), [show])

  return (
    <ToastContext.Provider value={{ show, success, error, info }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast }) {
  const styles = {
    success: 'bg-green-600 dark:bg-green-500 text-white',
    error: 'bg-red-600 dark:bg-red-500 text-white',
    info: 'bg-blue-600 dark:bg-blue-500 text-white',
  }
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-[slideIn_0.3s_ease] ${styles[toast.type]}`}>
      <span className="font-bold">{icons[toast.type]}</span>
      <span className="text-sm font-medium">{toast.message}</span>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}

export default ToastContext
