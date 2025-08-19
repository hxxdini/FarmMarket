"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { io, Socket } from "socket.io-client"
import { toast } from "sonner"

interface AnalyticsUpdate {
  type: string
  timestamp: Date
}

interface UserRegistered {
  userId: string
  timestamp: Date
}

interface ListingCreated {
  listingId: string
  timestamp: Date
}

interface MarketPriceSubmitted {
  priceId: string
  timestamp: Date
}

interface ReviewSubmitted {
  reviewId: string
  timestamp: Date
}

interface MessageSent {
  messageId: string
  timestamp: Date
}

export function useAnalyticsUpdates() {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [updateCount, setUpdateCount] = useState(0)

  // Initialize socket connection
  useEffect(() => {
    if (!session?.user) return

    // Check if user is admin
    const userRole = (session.user as any)?.role
    if (userRole !== 'admin' && userRole !== 'superadmin') return

    const newSocket = io({
      path: '/api/socket',
      auth: {
        session: session
      }
    })

    newSocket.on('connect', () => {
      console.log('Analytics socket connected')
      setIsConnected(true)
      
      // Join analytics room
      newSocket.emit('join_analytics')
    })

    newSocket.on('disconnect', () => {
      console.log('Analytics socket disconnected')
      setIsConnected(false)
    })

    // Analytics events
    newSocket.on('analytics_updated', (data: AnalyticsUpdate) => {
      console.log('Analytics updated:', data)
      setLastUpdate(data.timestamp)
      setUpdateCount(prev => prev + 1)
      
      // Show toast notification for significant updates
      toast.success(`📊 Analytics updated: ${data.type}`, {
        duration: 3000
      })
    })

    newSocket.on('user_registered', (data: UserRegistered) => {
      console.log('New user registered:', data)
      setLastUpdate(data.timestamp)
      setUpdateCount(prev => prev + 1)
      
      toast.info(`👤 New user registered`, {
        duration: 3000
      })
    })

    newSocket.on('listing_created', (data: ListingCreated) => {
      console.log('New listing created:', data)
      setLastUpdate(data.timestamp)
      setUpdateCount(prev => prev + 1)
      
      toast.info(`🛒 New marketplace listing`, {
        duration: 3000
      })
    })

    newSocket.on('market_price_submitted', (data: MarketPriceSubmitted) => {
      console.log('New market price submitted:', data)
      setLastUpdate(data.timestamp)
      setUpdateCount(prev => prev + 1)
      
      toast.info(`💰 New market price submitted`, {
        duration: 3000
      })
    })

    newSocket.on('review_submitted', (data: ReviewSubmitted) => {
      console.log('New review submitted:', data)
      setLastUpdate(data.timestamp)
      setUpdateCount(prev => prev + 1)
      
      toast.info(`⭐ New review submitted`, {
        duration: 3000
      })
    })

    newSocket.on('message_sent', (data: MessageSent) => {
      console.log('New message sent:', data)
      setLastUpdate(data.timestamp)
      setUpdateCount(prev => prev + 1)
      
      toast.info(`💬 New message sent`, {
        duration: 3000
      })
    })

    setSocket(newSocket)

    return () => {
      newSocket.emit('leave_analytics')
      newSocket.disconnect()
    }
  }, [session])

  // Manual refresh function
  const refreshAnalytics = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('join_analytics')
      setUpdateCount(prev => prev + 1)
      setLastUpdate(new Date())
    }
  }, [socket, isConnected])

  return {
    socket,
    isConnected,
    lastUpdate,
    updateCount,
    refreshAnalytics
  }
}
