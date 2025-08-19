import { toast } from 'sonner'
import { emitPriceAlertTriggered } from '@/lib/socket'

export interface PriceAlertNotification {
  id: string
  title: string
  message: string
  type: 'price_increase' | 'price_decrease' | 'price_volatility' | 'regional_difference' | 'quality_opportunity' | 'seasonal_trend'
  cropType: string
  location: string
  oldPrice?: number
  newPrice?: number
  priceChange?: number
  threshold: number
  timestamp: Date
}

export interface PriceAlert {
  id: string
  userId: string
  cropType: string
  location: string
  quality: string | null
  alertType: string
  frequency: string
  threshold: number
  isActive: boolean
  lastTriggered?: Date
}

export interface MarketPrice {
  id: string
  cropType: string
  pricePerUnit: number
  unit: string
  quality: string
  location: string
  effectiveDate: Date
  priceChange?: number
}

class PriceAlertNotificationService {
  private static instance: PriceAlertNotificationService
  private checkInterval: NodeJS.Timeout | null = null
  private isRunning = false

  private constructor() {}

  static getInstance(): PriceAlertNotificationService {
    if (!PriceAlertNotificationService.instance) {
      PriceAlertNotificationService.instance = new PriceAlertNotificationService()
    }
    return PriceAlertNotificationService.instance
  }

  /**
   * Start monitoring price alerts
   */
  startMonitoring() {
    if (this.isRunning) return
    
    this.isRunning = true
    // Check every 5 minutes for price changes
    this.checkInterval = setInterval(() => {
      this.checkPriceAlerts()
    }, 5 * 60 * 1000)
    
    console.log('Price alert monitoring started')
  }

  /**
   * Stop monitoring price alerts
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.isRunning = false
    console.log('Price alert monitoring stopped')
  }

  /**
   * Check for triggered price alerts
   */
  private async checkPriceAlerts() {
    try {
      // Fetch active price alerts
      const alertsResponse = await fetch('/api/price-alerts')
      if (!alertsResponse.ok) return
      
      const alertsData = await alertsResponse.json()
      const activeAlerts = alertsData.data?.filter((alert: PriceAlert) => alert.isActive) || []

      // Fetch recent market prices
      const pricesResponse = await fetch('/api/market-prices?limit=100&sortBy=effectiveDate&sortOrder=desc')
      if (!pricesResponse.ok) return
      
      const pricesData = await pricesResponse.json()
      const recentPrices = pricesData.prices || []

      // Check each alert for triggers
      for (const alert of activeAlerts) {
        await this.checkAlertTrigger(alert, recentPrices)
      }
    } catch (error) {
      console.error('Error checking price alerts:', error)
    }
  }

  /**
   * Check if a specific alert should be triggered
   */
  private async checkAlertTrigger(alert: PriceAlert, recentPrices: MarketPrice[]) {
    try {
      // Filter prices by alert criteria
      const relevantPrices = recentPrices.filter(price => 
        price.cropType.toLowerCase() === alert.cropType.toLowerCase() &&
        price.location.toLowerCase() === alert.location.toLowerCase() &&
        (!alert.quality || price.quality === alert.quality)
      )

      if (relevantPrices.length < 2) return

      // Get the two most recent prices
      const [latestPrice, previousPrice] = relevantPrices.slice(0, 2)
      
      // Calculate price change percentage
      const priceChange = ((latestPrice.pricePerUnit - previousPrice.pricePerUnit) / previousPrice.pricePerUnit) * 100
      const absoluteChange = Math.abs(priceChange)

      // Check if threshold is met
      if (absoluteChange >= alert.threshold) {
        // Check if the alert type matches the price change direction
        const shouldTrigger = this.shouldTriggerBasedOnAlertType(alert.alertType, priceChange)
        
        if (shouldTrigger) {
          // Check frequency constraints
          if (this.shouldTriggerBasedOnFrequency(alert, alert.lastTriggered)) {
            await this.triggerAlert(alert, latestPrice, previousPrice, priceChange)
          }
        }
      }
    } catch (error) {
      console.error('Error checking alert trigger:', error)
    }
  }

  /**
   * Check if alert should trigger based on alert type and price change direction
   */
  private shouldTriggerBasedOnAlertType(alertType: string, priceChange: number): boolean {
    switch (alertType) {
      case 'PRICE_INCREASE':
        // Only trigger for actual price increases
        return priceChange > 0
        
      case 'PRICE_DECREASE':
        // Only trigger for actual price decreases
        return priceChange < 0
        
      case 'PRICE_VOLATILITY':
        // Trigger for any significant change (both increase and decrease)
        return true
        
      case 'REGIONAL_DIFFERENCE':
        // This would need comparison with other regions - simplified for now
        return true
        
      case 'QUALITY_OPPORTUNITY':
        // This would need quality-based analysis - simplified for now
        return true
        
      case 'SEASONAL_TREND':
        // This would need seasonal analysis - simplified for now
        return true
        
      default:
        return true
    }
  }

  /**
   * Check if alert should trigger based on frequency
   */
  private shouldTriggerBasedOnFrequency(alert: PriceAlert, lastTriggered?: Date): boolean {
    if (!lastTriggered) return true

    const now = new Date()
    const timeSinceLastTrigger = now.getTime() - lastTriggered.getTime()

    switch (alert.frequency) {
      case 'IMMEDIATE':
        return true
      case 'DAILY':
        return timeSinceLastTrigger >= 24 * 60 * 60 * 1000 // 24 hours
      case 'WEEKLY':
        return timeSinceLastTrigger >= 7 * 24 * 60 * 60 * 1000 // 7 days
      case 'MONTHLY':
        return timeSinceLastTrigger >= 30 * 24 * 60 * 60 * 1000 // 30 days
      default:
        return true
    }
  }

  /**
   * Trigger a price alert notification
   */
  private async triggerAlert(alert: PriceAlert, latestPrice: MarketPrice, previousPrice: MarketPrice, priceChange: number) {
    try {
      // Create notification
      const notification: PriceAlertNotification = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: this.generateAlertTitle(alert.alertType, alert.cropType, alert.location),
        message: this.generateAlertMessage(alert, latestPrice, previousPrice, priceChange),
        type: alert.alertType.toLowerCase() as any,
        cropType: alert.cropType,
        location: alert.location,
        oldPrice: previousPrice.pricePerUnit,
        newPrice: latestPrice.pricePerUnit,
        priceChange: priceChange,
        threshold: alert.threshold,
        timestamp: new Date()
      }

      // Emit WebSocket event for real-time notification
      try {
        emitPriceAlertTriggered(
          alert.id,
          alert.cropType,
          alert.location,
          alert.threshold,
          latestPrice.pricePerUnit
        )
      } catch (socketError) {
        console.error('Failed to emit price alert event:', socketError)
        // Fall back to toast notification if WebSocket fails
        this.showNotification(notification)
      }

      // Update alert last triggered time
      await this.updateAlertLastTriggered(alert.id)

      // Log the trigger
      console.log('Price alert triggered:', notification)
    } catch (error) {
      console.error('Error triggering alert:', error)
    }
  }

  /**
   * Generate alert title
   */
  private generateAlertTitle(alertType: string, cropType: string, location: string): string {
    const typeLabels: Record<string, string> = {
      'PRICE_INCREASE': 'Price Increase Alert',
      'PRICE_DECREASE': 'Price Decrease Alert',
      'PRICE_VOLATILITY': 'Price Volatility Alert',
      'REGIONAL_DIFFERENCE': 'Regional Price Difference',
      'QUALITY_OPPORTUNITY': 'Quality Opportunity Alert',
      'SEASONAL_TREND': 'Seasonal Trend Alert'
    }

    return `${typeLabels[alertType] || 'Price Alert'} - ${cropType} in ${location}`
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(alert: PriceAlert, latestPrice: MarketPrice, previousPrice: MarketPrice, priceChange: number): string {
    const direction = priceChange > 0 ? 'increased' : 'decreased'
    const percentage = Math.abs(priceChange).toFixed(1)
    const oldPrice = previousPrice.pricePerUnit.toLocaleString()
    const newPrice = latestPrice.pricePerUnit.toLocaleString()
    const unit = latestPrice.unit

    return `${alert.cropType} prices have ${direction} by ${percentage}% in ${alert.location}. Price changed from UGX ${oldPrice} to UGX ${newPrice} per ${unit}.`
  }

  /**
   * Show notification to user
   */
  private showNotification(notification: PriceAlertNotification) {
    // Show toast notification
    toast(notification.title, {
      description: notification.message,
      duration: 10000, // 10 seconds
      action: {
        label: 'View Details',
        onClick: () => {
          // Navigate to price alerts page
          window.location.href = '/price-alerts'
        }
      }
    })

    // Store notification in localStorage for persistence
    this.storeNotification(notification)
  }

  /**
   * Store notification in localStorage
   */
  private storeNotification(notification: PriceAlertNotification) {
    try {
      const existingNotifications = this.getStoredNotifications()
      existingNotifications.unshift(notification)
      
      // Keep only last 50 notifications
      if (existingNotifications.length > 50) {
        existingNotifications.splice(50)
      }
      
      localStorage.setItem('priceAlertNotifications', JSON.stringify(existingNotifications))
    } catch (error) {
      console.error('Error storing notification:', error)
    }
  }

  /**
   * Get stored notifications from localStorage
   */
  getStoredNotifications(): PriceAlertNotification[] {
    try {
      const stored = localStorage.getItem('priceAlertNotifications')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error getting stored notifications:', error)
      return []
    }
  }

  /**
   * Clear stored notifications
   */
  clearStoredNotifications() {
    try {
      localStorage.removeItem('priceAlertNotifications')
    } catch (error) {
      console.error('Error clearing notifications:', error)
    }
  }

  /**
   * Update alert last triggered time
   */
  private async updateAlertLastTriggered(alertId: string) {
    try {
      await fetch(`/api/price-alerts/${alertId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lastTriggered: new Date().toISOString()
        }),
      })
    } catch (error) {
      console.error('Error updating alert last triggered:', error)
    }
  }

  /**
   * Manually check for alerts (for testing)
   */
  async manualCheck() {
    await this.checkPriceAlerts()
  }
}

export default PriceAlertNotificationService
