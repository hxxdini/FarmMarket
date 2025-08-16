import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

// GET /api/price-alerts - Fetch user's price alerts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const cropType = searchParams.get('cropType')
    const location = searchParams.get('location')
    const alertType = searchParams.get('alertType')
    const isActive = searchParams.get('isActive')
    
    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Build where clause
    const where: any = { userId: user.id }
    
    if (cropType) where.cropType = { contains: cropType, mode: 'insensitive' }
    if (location) where.location = { contains: location, mode: 'insensitive' }
    if (alertType) where.alertType = alertType
    if (isActive !== null) where.isActive = isActive === 'true'

    // Fetch user's price alerts
    const alerts = await prisma.priceAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ data: alerts })
  } catch (error) {
    console.error('Error fetching price alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch price alerts' },
      { status: 500 }
    )
  }
}

// POST /api/price-alerts - Create a new price alert
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      cropType,
      location,
      quality,
      alertType,
      frequency = 'DAILY',
      threshold
    } = body

    // Validation
    if (!cropType || !location || !alertType || !threshold) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (threshold <= 0 || threshold > 100) {
      return NextResponse.json(
        { error: "Threshold must be between 0 and 100" },
        { status: 400 }
      )
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if alert already exists
    const existingAlert = await prisma.priceAlert.findFirst({
      where: {
        userId: user.id,
        cropType,
        location,
        quality: quality || null,
        alertType
      }
    })

    if (existingAlert) {
      return NextResponse.json(
        { error: "Price alert already exists for this combination" },
        { status: 409 }
      )
    }

    // Create the price alert
    const priceAlert = await prisma.priceAlert.create({
      data: {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        cropType: cropType.trim(),
        location: location.trim(),
        quality: quality || null,
        alertType,
        frequency,
        threshold: parseFloat(threshold),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      message: "Price alert created successfully",
      data: priceAlert
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating price alert:', error)
    return NextResponse.json(
      { error: 'Failed to create price alert' },
      { status: 500 }
    )
  }
}
