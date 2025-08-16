import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

// GET /api/admin/moderation/reviews - Get reviews for moderation
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'pending'
    const reviewType = searchParams.get('reviewType') || 'all'
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause based on filters
    const where: any = {}

    // Status filter
    if (status === 'pending') {
      where.isModerated = false // Show reviews that haven't been moderated yet
    } else if (status === 'approved') {
      where.isModerated = true
      where.isPublic = true
    } else if (status === 'rejected') {
      where.isModerated = true
      where.isPublic = false
    } else if (status === 'flagged') {
      where.isModerated = false
      where.moderationReason = { not: null }
    }

    // Review type filter
    if (reviewType !== 'all') {
      where.reviewType = reviewType
    }

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { comment: { contains: search, mode: 'insensitive' } },
        { User_Review_reviewerIdToUser: { name: { contains: search, mode: 'insensitive' } } },
        { User_Review_reviewedIdToUser: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Fetch reviews with pagination
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          User_Review_reviewerIdToUser: {
            select: {
              id: true,
              name: true,
              avatar: true,
              email: true
            }
          },
          User_Review_reviewedIdToUser: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          ProductListing: {
            select: {
              id: true,
              cropType: true,
              quantity: true,
              unit: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.review.count({ where })
    ])

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching reviews for moderation:', error)
    console.error('Error details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews for moderation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
