import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'

interface MarketplaceUpdate {
  newListings: number
  totalListings: number
  timestamp: Date
}

export function useMarketplaceUpdates() {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [updateCount, setUpdateCount] = useState(0)

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
      console.log('Marketplace socket connected')
      setIsConnected(true)
      
      // Join marketplace room
      newSocket.emit('join_marketplace')
    })

    newSocket.on('disconnect', () => {
      console.log('Marketplace socket disconnected')
      setIsConnected(false)
    })

    // Listen for marketplace updates
    newSocket.on('marketplace_updated', (data: MarketplaceUpdate) => {
      console.log('Marketplace updated:', data)
      setLastUpdate(data.timestamp)
      setUpdateCount(prev => prev + 1)
      
      // Show toast notification for new listings
      if (data.newListings > 0) {
        toast.success(`🎉 ${data.newListings} new listing${data.newListings > 1 ? 's' : ''} added to marketplace!`, {
          duration: 5000,
          action: {
            label: 'View',
            onClick: () => window.location.reload()
          }
        })
      }
    })

    setSocket(newSocket)

    return () => {
      newSocket.emit('leave_marketplace')
      newSocket.disconnect()
    }
  }, [session?.user])

  // Manual refresh function
  const refreshMarketplace = () => {
    if (socket && isConnected) {
      socket.emit('join_marketplace')
      setUpdateCount(prev => prev + 1)
      setLastUpdate(new Date())
    }
  }

  return {
    socket,
    isConnected,
    lastUpdate,
    updateCount,
    refreshMarketplace
  }
}
