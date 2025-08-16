import { prisma } from "./prisma"

export interface PriceChangeData {
  cropType: string
  location: string
  quality: string | null
  oldPrice: number
  newPrice: number
  priceChange: number
  changePercentage: number
  alertType: 'PRICE_INCREASE' | 'PRICE_DECREASE' | 'PRICE_VOLATILITY'
}

export interface AlertTrigger {
  alertId: string
  userId: string
  cropType: string
  location: string
  quality: string | null
  alertType: string
  threshold: number
  oldPrice: number
  newPrice: number
  priceChange: number
  changePercentage: number
}

/**
 * Detect price changes and trigger alerts
 */
export async function detectPriceChanges(): Promise<void> {
  try {
    console.log('Starting price change detection...')
    
    // Get all active price alerts
    const activeAlerts = await prisma.priceAlert.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            emailNotifications: true,
            pushNotifications: true
          }
        }
      }
    })

    if (activeAlerts.length === 0) {
      console.log('No active price alerts found')
      return
    }

    console.log(`Found ${activeAlerts.length} active price alerts`)

    // Group alerts by crop, location, and quality for efficient processing
    const alertGroups = groupAlertsByCriteria(activeAlerts)
    
    // Process each group
    for (const [key, alerts] of alertGroups) {
      await processAlertGroup(key, alerts)
    }

    console.log('Price change detection completed')
  } catch (error) {
    console.error('Error in price change detection:', error)
  }
}

/**
 * Group alerts by crop, location, and quality for efficient processing
 */
function groupAlertsByCriteria(alerts: any[]): Map<string, any[]> {
  const groups = new Map<string, any[]>()
  
  for (const alert of alerts) {
    const key = `${alert.cropType}|${alert.location}|${alert.quality || 'ANY'}`
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(alert)
  }
  
  return groups
}

/**
 * Process a group of alerts for the same crop, location, and quality
 */
async function processAlertGroup(key: string, alerts: any[]): Promise<void> {
  try {
    const [cropType, location, quality] = key.split('|')
    const actualQuality = quality === 'ANY' ? null : quality
    
    // Get recent price data for this combination
    const recentPrices = await getRecentPrices(cropType, location, actualQuality)
    
    if (recentPrices.length < 2) {
      return // Need at least 2 prices to detect changes
    }
    
    // Calculate price changes
    const priceChanges = calculatePriceChanges(recentPrices)
    
    // Check each alert against the price changes
    for (const alert of alerts) {
      await checkAndTriggerAlert(alert, priceChanges)
    }
  } catch (error) {
    console.error(`Error processing alert group ${key}:`, error)
  }
}

/**
 * Get recent prices for a specific crop, location, and quality
 */
async function getRecentPrices(cropType: string, location: string, quality: string | null): Promise<any[]> {
  const where: any = {
    cropType: { contains: cropType, mode: 'insensitive' },
    location: { contains: location, mode: 'insensitive' },
    status: 'APPROVED',
    isVerified: true
  }
  
  if (quality) {
    where.quality = quality
  }
  
  return await prisma.marketPrice.findMany({
    where,
    orderBy: { effectiveDate: 'desc' },
    take: 10 // Get last 10 prices
  })
}

/**
 * Calculate price changes from recent price data
 */
function calculatePriceChanges(prices: any[]): PriceChangeData[] {
  const changes: PriceChangeData[] = []
  
  for (let i = 1; i < prices.length; i++) {
    const newPrice = prices[i - 1]
    const oldPrice = prices[i]
    
    const priceChange = newPrice.pricePerUnit - oldPrice.pricePerUnit
    const changePercentage = (priceChange / oldPrice.pricePerUnit) * 100
    
    let alertType: 'PRICE_INCREASE' | 'PRICE_DECREASE' | 'PRICE_VOLATILITY'
    
    if (changePercentage > 5) {
      alertType = 'PRICE_INCREASE'
    } else if (changePercentage < -5) {
      alertType = 'PRICE_DECREASE'
    } else if (Math.abs(changePercentage) > 2) {
      alertType = 'PRICE_VOLATILITY'
    } else {
      continue // Skip small changes
    }
    
    changes.push({
      cropType: newPrice.cropType,
      location: newPrice.location,
      quality: newPrice.quality,
      oldPrice: oldPrice.pricePerUnit,
      newPrice: newPrice.pricePerUnit,
      priceChange,
      changePercentage,
      alertType
    })
  }
  
  return changes
}

/**
 * Check if an alert should be triggered and create notification if needed
 */
async function checkAndTriggerAlert(alert: any, priceChanges: PriceChangeData[]): Promise<void> {
  try {
    // Find relevant price changes for this alert
    const relevantChanges = priceChanges.filter(change => 
      change.cropType.toLowerCase().includes(alert.cropType.toLowerCase()) &&
      change.location.toLowerCase().includes(alert.location.toLowerCase()) &&
      (!alert.quality || change.quality === alert.quality) &&
      change.alertType === alert.alertType
    )
    
    if (relevantChanges.length === 0) {
      return
    }
    
    // Check if any change exceeds the threshold
    const significantChanges = relevantChanges.filter(change => 
      Math.abs(change.changePercentage) >= alert.threshold
    )
    
    if (significantChanges.length === 0) {
      return
    }
    
    // Check if we should trigger based on frequency
    if (!shouldTriggerBasedOnFrequency(alert)) {
      return
    }
    
    // Create notifications for significant changes
    for (const change of significantChanges) {
      await createAlertNotification(alert, change)
    }
    
    // Update last triggered timestamp
    await prisma.priceAlert.update({
      where: { id: alert.id },
      data: { lastTriggered: new Date() }
    })
    
  } catch (error) {
    console.error(`Error checking alert ${alert.id}:`, error)
  }
}

/**
 * Check if alert should be triggered based on frequency settings
 */
function shouldTriggerBasedOnFrequency(alert: any): boolean {
  if (!alert.lastTriggered) {
    return true // First time triggering
  }
  
  const now = new Date()
  const lastTriggered = new Date(alert.lastTriggered)
  const hoursSinceLastTrigger = (now.getTime() - lastTriggered.getTime()) / (1000 * 60 * 60)
  
  switch (alert.frequency) {
    case 'IMMEDIATE':
      return true
    case 'DAILY':
      return hoursSinceLastTrigger >= 24
    case 'WEEKLY':
      return hoursSinceLastTrigger >= 168 // 7 * 24
    case 'MONTHLY':
      return hoursSinceLastTrigger >= 720 // 30 * 24
    default:
      return true
  }
}

/**
 * Create an alert notification
 */
async function createAlertNotification(alert: any, priceChange: PriceChangeData): Promise<void> {
  try {
    const title = generateAlertTitle(alert.alertType, priceChange)
    const message = generateAlertMessage(alert, priceChange)
    
    await prisma.alertNotification.create({
      data: {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        alertId: alert.id,
        userId: alert.userId,
        title,
        message,
        alertType: alert.alertType,
        cropType: priceChange.cropType,
        location: priceChange.location,
        oldPrice: priceChange.oldPrice,
        newPrice: priceChange.newPrice,
        priceChange: priceChange.priceChange,
        status: 'PENDING',
        createdAt: new Date()
      }
    })
    
    console.log(`Created notification for alert ${alert.id}: ${title}`)
    
    // TODO: Send actual notifications (email, push, SMS)
    // await sendNotification(alert.user, title, message)
    
  } catch (error) {
    console.error('Error creating alert notification:', error)
  }
}

/**
 * Generate alert title based on alert type and price change
 */
function generateAlertTitle(alertType: string, priceChange: PriceChangeData): string {
  const crop = priceChange.cropType
  const location = priceChange.location
  
  switch (alertType) {
    case 'PRICE_INCREASE':
      return `🚀 ${crop} prices up ${priceChange.changePercentage.toFixed(1)}% in ${location}`
    case 'PRICE_DECREASE':
      return `📉 ${crop} prices down ${Math.abs(priceChange.changePercentage).toFixed(1)}% in ${location}`
    case 'PRICE_VOLATILITY':
      return `📊 ${crop} price volatility detected in ${location}`
    default:
      return `📈 ${crop} price alert for ${location}`
  }
}

/**
 * Generate detailed alert message
 */
function generateAlertMessage(alert: any, priceChange: PriceChangeData): string {
  const crop = priceChange.cropType
  const location = priceChange.location
  const change = priceChange.changePercentage
  const oldPrice = priceChange.oldPrice
  const newPrice = priceChange.newPrice
  
  let message = `${crop} prices in ${location} have changed significantly.\n\n`
  message += `Previous price: ${oldPrice.toFixed(2)} per unit\n`
  message += `Current price: ${newPrice.toFixed(2)} per unit\n`
  message += `Change: ${change > 0 ? '+' : ''}${change.toFixed(1)}%\n\n`
  
  if (change > 0) {
    message += `This represents a price increase above your ${alert.threshold}% threshold. `
    message += `Consider if this is a good time to sell or if you should wait for better prices.`
  } else {
    message += `This represents a price decrease above your ${alert.threshold}% threshold. `
    message += `This might be a good opportunity to buy or stock up.`
  }
  
  return message
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    return await prisma.alertNotification.count({
      where: {
        userId,
        status: 'PENDING'
      }
    })
  } catch (error) {
    console.error('Error getting unread notification count:', error)
    return 0
  }
}

/**
 * Clean up old notifications (older than 30 days)
 */
export async function cleanupOldNotifications(): Promise<void> {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const deletedCount = await prisma.alertNotification.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
        status: { in: ['READ', 'DISMISSED'] }
      }
    })
    
    console.log(`Cleaned up ${deletedCount.count} old notifications`)
  } catch (error) {
    console.error('Error cleaning up old notifications:', error)
  }
}
