import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

// GET /api/admin/notifications - Get real-time notification counts
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

    // Get notification counts in parallel
    const [
      pendingReviews,
      flaggedContent,
      newUsers,
      newListings
    ] = await Promise.all([
      // Pending reviews for moderation
      prisma.review.count({
        where: { 
          isModerated: false,
          isPublic: true
        }
      }),
      
      // Flagged content
      prisma.review.count({
        where: { 
          isModerated: false,
          moderationReason: { not: null }
        }
      }),
      
      // New users in last 24 hours
      prisma.user.count({
        where: { 
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      }),
      
      // New listings in last 24 hours
      prisma.productListing.count({
        where: { 
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      })
    ])

    return NextResponse.json({
      pendingReviews,
      flaggedContent,
      newUsers,
      newListings,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching admin notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin notifications' },
      { status: 500 }
    )
  }
}
