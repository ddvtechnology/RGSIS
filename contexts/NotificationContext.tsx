"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import { Notification } from "@/components/Notification"

type NotificationType = "success" | "error" | "warning" | "default"

interface NotificationContextType {
  showNotification: (message: string, type: NotificationType) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null)

  const showNotification = (message: string, type: NotificationType) => {
    setNotification({ message, type })
  }

  const closeNotification = () => {
    setNotification(null)
  }

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <Notification message={notification.message} variant={notification.type} onClose={closeNotification} />
      )}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider")
  }
  return context
}

