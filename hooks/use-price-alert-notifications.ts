import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import PriceAlertNotificationService, { PriceAlertNotification } from '@/lib/price-alert-notification-service'

export function usePriceAlertNotifications() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<PriceAlertNotification[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  // Initialize the notification service
  const notificationService = PriceAlertNotificationService.getInstance()

  // Start monitoring price alerts
  const startMonitoring = useCallback(() => {
    if (!session?.user) return
    
    notificationService.startMonitoring()
    setIsMonitoring(true)
    console.log('Price alert monitoring started')
  }, [session?.user, notificationService])

  // Stop monitoring price alerts
  const stopMonitoring = useCallback(() => {
    notificationService.stopMonitoring()
    setIsMonitoring(false)
    console.log('Price alert monitoring stopped')
  }, [notificationService])

  // Manually check for alerts
  const manualCheck = useCallback(async () => {
    if (!session?.user) return
    
    try {
      await notificationService.manualCheck()
      setLastCheck(new Date())
    } catch (error) {
      console.error('Error during manual check:', error)
    }
  }, [session?.user, notificationService])

  // Get stored notifications
  const getStoredNotifications = useCallback(() => {
    const stored = notificationService.getStoredNotifications()
    setNotifications(stored)
    return stored
  }, [notificationService])

  // Clear stored notifications
  const clearNotifications = useCallback(() => {
    notificationService.clearStoredNotifications()
    setNotifications([])
  }, [notificationService])

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    )
  }, [])

  // Get unread notifications count
  const getUnreadCount = useCallback(() => {
    return notifications.filter(notification => !notification.read).length
  }, [notifications])

  // Initialize on component mount
  useEffect(() => {
    if (session?.user) {
      // Load stored notifications
      getStoredNotifications()
      
      // Start monitoring if not already running
      if (!isMonitoring) {
        startMonitoring()
      }
    } else {
      // Stop monitoring if user is not authenticated
      if (isMonitoring) {
        stopMonitoring()
      }
    }

    // Cleanup on unmount
    return () => {
      if (isMonitoring) {
        stopMonitoring()
      }
    }
  }, [session?.user, isMonitoring, startMonitoring, stopMonitoring, getStoredNotifications])

  // Set up interval for periodic checks (every 5 minutes)
  useEffect(() => {
    if (!session?.user || !isMonitoring) return

    const interval = setInterval(() => {
      setLastCheck(new Date())
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [session?.user, isMonitoring])

  return {
    notifications,
    isMonitoring,
    lastCheck,
    startMonitoring,
    stopMonitoring,
    manualCheck,
    getStoredNotifications,
    clearNotifications,
    markAsRead,
    getUnreadCount,
    unreadCount: getUnreadCount()
  }
}
