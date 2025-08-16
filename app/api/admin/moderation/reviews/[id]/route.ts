import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

// PUT /api/admin/moderation/reviews/[id] - Moderate a review
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { Role: true }
    })

    if (user?.Role.name !== 'admin' && user?.Role.name !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 })
    }

    const { id } = await params
    const { action, reason } = await req.json()

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "approve" or "reject".' }, { status: 400 })
    }

    // Get the review
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        User_Review_reviewerIdToUser: { select: { id: true, name: true, email: true } },
        User_Review_reviewedIdToUser: { select: { id: true, name: true, email: true } }
      }
    })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Update the review based on action
    const updateData: any = {
      isModerated: true,
      moderatedAt: new Date()
    }

    if (action === 'approve') {
      updateData.isPublic = true
      updateData.moderationReason = null
    } else if (action === 'reject') {
      updateData.isPublic = false
      updateData.moderationReason = reason || 'Rejected by admin'
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: updateData,
      include: {
        User_Review_reviewerIdToUser: { select: { id: true, name: true, email: true } },
        User_Review_reviewedIdToUser: { select: { id: true, name: true, email: true } }
      }
    })

    // Log the moderation action
    await prisma.adminActionLog.create({
      data: {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        adminId: user!.id,
        action: `REVIEW_${action.toUpperCase()}`,
        targetType: 'REVIEW',
        targetId: id,
        details: {
          reviewId: id,
          action,
          reason: reason || null,
          reviewerName: review.User_Review_reviewerIdToUser.name,
          reviewedName: review.User_Review_reviewedIdToUser.name,
          reviewTitle: review.title,
          rating: review.rating
        },
        timestamp: new Date()
      }
    })

    // TODO: Send notification to user about review status
    // This would integrate with the notification system

    return NextResponse.json({
      message: `Review ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      review: updatedReview
    })
  } catch (error) {
    console.error('Error moderating review:', error)
    return NextResponse.json(
      { error: 'Failed to moderate review' },
      { status: 500 }
    )
  }
}

// GET /api/admin/moderation/reviews/[id] - Get specific review details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { Role: true }
    })

    if (user?.Role.name !== 'admin' && user?.Role.name !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 })
    }

    const { id } = await params

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        User_Review_reviewerIdToUser: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true,
            createdAt: true,
            location: true
          }
        },
        User_Review_reviewedIdToUser: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true,
            createdAt: true,
            location: true
          }
        },
        ProductListing: {
          select: {
            id: true,
            cropType: true,
            quantity: true,
            unit: true,
            pricePerUnit: true,
            quality: true,
            location: true,
            status: true,
            createdAt: true
          }
        }
      }
    })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Error fetching review details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch review details' },
      { status: 500 }
    )
  }
}
