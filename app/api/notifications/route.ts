import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

// GET /api/notifications - Fetch user's notifications
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'PENDING'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Fetch user's notifications
    const notifications = await prisma.alertNotification.findMany({
      where: {
        userId: user.id,
        status: status as any
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        PriceAlert: {
          select: {
            cropType: true,
            location: true,
            alertType: true,
            threshold: true
          }
        }
      }
    })

    // Get total count for pagination
    const totalCount = await prisma.alertNotification.count({
      where: {
        userId: user.id,
        status: status as any
      }
    })

    // Get unread count
    const unreadCount = await prisma.alertNotification.count({
      where: {
        userId: user.id,
        status: 'PENDING'
      }
    })

    return NextResponse.json({
      data: notifications,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      unreadCount
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// PUT /api/notifications - Mark notifications as read
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { notificationIds, action } = body

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: "Missing or invalid notificationIds" },
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
    
    switch (action) {
      case 'markAsRead':
        updateData = { status: 'READ', readAt: new Date() }
        break
      case 'dismiss':
        updateData = { status: 'DISMISSED', dismissedAt: new Date() }
        break
      default:
        return NextResponse.json(
          { error: "Invalid action. Use 'markAsRead' or 'dismiss'" },
          { status: 400 }
        )
    }

    // Update notifications
    const result = await prisma.alertNotification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: user.id // Ensure user can only update their own notifications
      },
      data: updateData
    })

    return NextResponse.json({
      message: `Successfully ${action === 'markAsRead' ? 'marked as read' : 'dismissed'} ${result.count} notifications`
    })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications - Delete notifications
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const notificationIds = searchParams.get('ids')?.split(',') || []

    if (notificationIds.length === 0) {
      return NextResponse.json(
        { error: "No notification IDs provided" },
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

    // Delete notifications
    const result = await prisma.alertNotification.deleteMany({
      where: {
        id: { in: notificationIds },
        userId: user.id // Ensure user can only delete their own notifications
      }
    })

    return NextResponse.json({
      message: `Successfully deleted ${result.count} notifications`
    })
  } catch (error) {
    console.error('Error deleting notifications:', error)
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    )
  }
}
