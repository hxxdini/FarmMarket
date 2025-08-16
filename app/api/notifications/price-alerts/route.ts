import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

// GET /api/notifications/price-alerts - Fetch user's price alert notifications
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    const skip = (page - 1) * limit

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Build where clause
    const where: any = { userId: user.id }
    if (status !== 'all') where.status = status

    // Fetch notifications with pagination
    const [notifications, total] = await Promise.all([
      prisma.alertNotification.findMany({
        where,
        include: {
          alert: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.alertNotification.count({ where })
    ])

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// POST /api/notifications/price-alerts - Mark notifications as read/dismissed
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { action, notificationIds } = body

    if (!action || !notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: "Invalid request. Action and notificationIds array required." },
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

    let updateData: any = {}
    let message = ''

    switch (action) {
      case 'mark_read':
        updateData = {
          status: 'READ',
          readAt: new Date()
        }
        message = 'Notifications marked as read'
        break
      
      case 'dismiss':
        updateData = {
          status: 'DISMISSED',
          dismissedAt: new Date()
        }
        message = 'Notifications dismissed'
        break
      
      default:
        return NextResponse.json(
          { error: "Invalid action. Must be 'mark_read' or 'dismiss'." },
          { status: 400 }
        )
    }

    // Update notifications
    const updatedNotifications = await prisma.alertNotification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: user.id
      },
      data: updateData
    })

    return NextResponse.json({
      message,
      affectedCount: updatedNotifications.count
    })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
}
