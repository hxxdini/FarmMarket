import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

// POST /api/test-price-alert - Test price alert notification
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { cropType, location, priceChange, alertType } = body

    // Validate required fields
    if (!cropType || !location || !priceChange || !alertType) {
      return NextResponse.json(
        { error: "Missing required fields: cropType, location, priceChange, alertType" }, { status: 400 })
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create a test market price entry to simulate price change
    const testPrice = await prisma.marketPrice.create({
      data: {
        id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        cropType: cropType,
        pricePerUnit: 1000 + (priceChange * 10), // Simulate price change
        unit: "kg",
        quality: "STANDARD",
        location: location,
        source: "MARKET_SURVEY",
        status: "APPROVED",
        submittedBy: user.id,
        isVerified: true,
        effectiveDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Create a test price alert for the user
    const testAlert = await prisma.priceAlert.create({
      data: {
        id: `test_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        cropType: cropType,
        location: location,
        quality: "STANDARD",
        alertType: alertType,
        frequency: "IMMEDIATE",
        threshold: Math.abs(priceChange),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Create a test notification
    const notification = await prisma.alertNotification.create({
      data: {
        id: `test_notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        alertId: testAlert.id,
        userId: user.id,
        title: `${alertType} Alert - ${cropType} in ${location}`,
        message: `Test notification: ${cropType} prices have changed by ${priceChange > 0 ? '+' : ''}${priceChange}% in ${location}. This is a test notification to verify the alert system is working correctly.`,
        alertType: alertType as any,
        cropType: cropType,
        location: location,
        oldPrice: 1000,
        newPrice: 1000 + (priceChange * 10),
        priceChange: priceChange * 10,
        status: "PENDING",
        createdAt: new Date()
      }
    })

    // Clean up test data after 1 hour
    setTimeout(async () => {
      try {
        await prisma.alertNotification.delete({ where: { id: notification.id } })
        await prisma.priceAlert.delete({ where: { id: testAlert.id } })
        await prisma.marketPrice.delete({ where: { id: testPrice.id } })
        console.log('Test data cleaned up')
      } catch (error) {
        console.error('Error cleaning up test data:', error)
      }
    }, 60 * 60 * 1000) // 1 hour

    // Return the notification data
    return NextResponse.json({
      message: "Test price alert notification created successfully",
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.alertType.toLowerCase(),
        cropType: notification.cropType,
        location: notification.location,
        priceChange: priceChange,
        threshold: Math.abs(priceChange),
        timestamp: notification.createdAt
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error creating test price alert:', error)
    return NextResponse.json(
      { error: 'Failed to create test price alert' },
      { status: 500 }
    )
  }
}

// GET /api/test-price-alert - Get test notification info
export async function GET() {
  return NextResponse.json({
    message: "Test Price Alert API",
    description: "Use POST to create test notifications",
    example: {
      cropType: "Maize",
      location: "Kampala",
      priceChange: 15.5,
      alertType: "PRICE_INCREASE"
    }
  })
}
