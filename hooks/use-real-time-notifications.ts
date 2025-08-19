import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'

interface PriceAlertNotification {
  alertId: string
  cropType: string
  location: string
  threshold: number
  currentPrice: number
  timestamp: Date
}

interface Notification {
  notificationId: string
  type: string
  message: string
  timestamp: Date
}

interface UnreadMessagesUpdate {
  unreadCount: number
  conversationId?: string
  timestamp: Date
}

export function useRealTimeNotifications() {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [priceAlerts, setPriceAlerts] = useState<PriceAlertNotification[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Initialize socket connection
  useEffect(() => {
    if (!session?.user) return

    const newSocket = io({
      path: '/api/socket',
      auth: {
        session: session
      }
    })

    newSocket.on('connect', () => {
      console.log('Notifications socket connected')
      setIsConnected(true)
      
      // Join notifications room
      newSocket.emit('join_notifications')
    })

    newSocket.on('disconnect', () => {
      console.log('Notifications socket disconnected')
      setIsConnected(false)
    })

    // Listen for price alert triggers
    newSocket.on('price_alert_triggered', (data: PriceAlertNotification) => {
      console.log('Price alert triggered:', data)
      setPriceAlerts(prev => [data, ...prev])
      setLastUpdate(data.timestamp)
      
      toast.warning(`🚨 Price Alert: ${data.cropType} in ${data.location} has reached ${data.currentPrice} UGX (threshold: ${data.threshold} UGX)`, {
        duration: 8000,
        action: {
          label: 'View',
          onClick: () => window.location.href = '/price-alerts'
        }
      })
    })

    // Listen for general notifications
    newSocket.on('notification_received', (data: Notification) => {
      console.log('Notification received:', data)
      setNotifications(prev => [data, ...prev])
      setLastUpdate(data.timestamp)
      
      toast.info(data.message, {
        duration: 5000
      })
    })

    // Listen for unread messages updates
    newSocket.on('unread_messages_updated', (data: UnreadMessagesUpdate) => {
      console.log('Unread messages updated:', data)
      setUnreadCount(data.unreadCount)
      setLastUpdate(data.timestamp)
      
      // Only show toast if count increased
      if (data.unreadCount > 0) {
        toast.info(`💬 ${data.unreadCount} unread message${data.unreadCount > 1 ? 's' : ''}`, {
          duration: 3000,
          action: {
            label: 'View',
            onClick: () => window.location.href = '/messages'
          }
        })
      }
    })

    setSocket(newSocket)

    return () => {
      newSocket.emit('leave_notifications')
      newSocket.disconnect()
    }
  }, [session?.user])

  // Manual refresh function
  const refreshNotifications = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('join_notifications')
      setLastUpdate(new Date())
    }
  }, [socket, isConnected])

  // Clear notifications
  const clearPriceAlerts = useCallback(() => {
    setPriceAlerts([])
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Mark notification as read
  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.notificationId === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    )
  }, [])

  return {
    socket,
    isConnected,
    priceAlerts,
    notifications,
    unreadCount,
    lastUpdate,
    refreshNotifications,
    clearPriceAlerts,
    clearNotifications,
    markNotificationAsRead
  }
}
