import React, { createContext, useContext, useState, ReactNode } from 'react'

interface UIContextType {
  loading: boolean
  setLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void
  success: string | null
  setSuccess: (success: string | null) => void
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void
}

const UIContext = createContext<UIContextType | undefined>(undefined)

export const useUI = () => {
  const context = useContext(UIContext)
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider')
  }
  return context
}

interface UIProviderProps {
  children: ReactNode
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    if (type === 'success') {
      setSuccess(message)
      setTimeout(() => setSuccess(null), 3000)
    } else if (type === 'error') {
      setError(message)
      setTimeout(() => setError(null), 5000)
    }
  }

  const value = {
    loading,
    setLoading,
    error,
    setError,
    success,
    setSuccess,
    showNotification,
  }

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}