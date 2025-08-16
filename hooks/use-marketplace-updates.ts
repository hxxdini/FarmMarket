import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface MarketplaceUpdate {
  id: string
  title: string
  farmer: string
  price: number
  unit: string
  location: string
}

export function useMarketplaceUpdates() {
  const [lastUpdateCount, setLastUpdateCount] = useState(0)
  const [isTracking, setIsTracking] = useState(false)

  const startTracking = async () => {
    try {
      const response = await fetch('/api/marketplace/listings?limit=1')
      if (response.ok) {
        const data = await response.json()
        setLastUpdateCount(data.pagination.total)
        setIsTracking(true)
      }
    } catch (error) {
      console.error('Failed to start tracking marketplace updates:', error)
    }
  }

  const checkForUpdates = async () => {
    if (!isTracking) return

    try {
      const response = await fetch('/api/marketplace/listings?limit=1')
      if (response.ok) {
        const data = await response.json()
        const currentCount = data.pagination.total
        
        if (currentCount > lastUpdateCount) {
          const newListings = currentCount - lastUpdateCount
          toast.success(`🎉 ${newListings} new listing${newListings > 1 ? 's' : ''} added to marketplace!`, {
            duration: 5000,
            action: {
              label: 'View',
              onClick: () => window.location.reload()
            }
          })
          setLastUpdateCount(currentCount)
        }
      }
    } catch (error) {
      console.error('Failed to check for marketplace updates:', error)
    }
  }

  useEffect(() => {
    startTracking()
  }, [])

  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(checkForUpdates, 30000) // Check every 30 seconds
      return () => clearInterval(interval)
    }
  }, [isTracking, lastUpdateCount])

  return {
    isTracking,
    lastUpdateCount,
    checkForUpdates
  }
}
