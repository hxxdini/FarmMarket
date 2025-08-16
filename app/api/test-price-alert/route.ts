import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"

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
        { error: "Missing required fields: cropType, location, priceChange, alertType" },
        { status: 400 }
      )
    }

    // Create a mock notification
    const notification = {
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `${alertType} Alert - ${cropType} in ${location}`,
      message: `Test notification: ${cropType} prices have changed by ${priceChange > 0 ? '+' : ''}${priceChange}% in ${location}.`,
      type: alertType.toLowerCase(),
      cropType,
      location,
      priceChange,
      threshold: Math.abs(priceChange),
      timestamp: new Date()
    }

    // Return the notification data
    return NextResponse.json({
      message: "Test price alert notification created",
      notification,
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
