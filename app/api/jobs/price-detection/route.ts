import { NextRequest, NextResponse } from "next/server"
import { detectPriceChanges, cleanupOldNotifications } from "@/lib/price-alert-service"

// POST /api/jobs/price-detection - Trigger price change detection job
export async function POST(req: NextRequest) {
  try {
    // This endpoint can be called by a cron job or scheduler
    // For now, we'll run it manually, but in production this should be automated
    
    console.log('Starting price change detection job...')
    
    // Run price change detection
    await detectPriceChanges()
    
    // Clean up old notifications
    await cleanupOldNotifications()
    
    console.log('Price change detection job completed successfully')
    
    return NextResponse.json({
      message: "Price change detection job completed successfully",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in price change detection job:', error)
    return NextResponse.json(
      { error: 'Price change detection job failed' },
      { status: 500 }
    )
  }
}

// GET /api/jobs/price-detection - Check job status (for monitoring)
export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      status: "Price change detection service is running",
      lastCheck: new Date().toISOString(),
      endpoints: {
        priceAlerts: "/api/price-alerts",
        notifications: "/api/notifications/price-alerts",
        marketPrices: "/api/market-prices"
      }
    })
  } catch (error) {
    console.error('Error checking job status:', error)
    return NextResponse.json(
      { error: 'Failed to check job status' },
      { status: 500 }
    )
  }
}
