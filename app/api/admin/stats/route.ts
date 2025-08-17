import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

// GET /api/admin/stats - Get admin dashboard statistics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if ((session?.user as any)?.role !== 'admin' && (session?.user as any)?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 })
    }

    // Get current date and last month for growth calculations
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Fetch statistics in parallel
    const [
      totalUsers,
      activeUsers,
      totalListings,
      activeListings,
      totalMessages,
      totalReviews,
      pendingModeration,
      flaggedContent,
      pendingMarketPrices,
      userGrowth,
      platformRevenue
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Active users (users with activity in last 30 days)
      prisma.user.count({
        where: {
          OR: [
            { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
            { updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
          ]
        }
      }),
      
      // Total listings
      prisma.productListing.count(),
      
      // Active listings
      prisma.productListing.count({
        where: { status: 'ACTIVE' }
      }),
      
      // Total messages
      prisma.message.count(),
      
      // Total reviews
      prisma.review.count(),
      
      // Pending moderation (reviews that need moderation)
      prisma.review.count({
        where: { 
          isModerated: false,
          OR: [
            { isPublic: false },
            { moderationReason: { not: null } }
          ]
        }
      }),
      
      // Flagged content (reviews marked for review)
      prisma.review.count({
        where: { 
          isModerated: false,
          moderationReason: { not: null }
        }
      }),
      
      // Pending market prices for review
      prisma.marketPrice.count({
        where: { status: 'PENDING' }
      }),
      
      // User growth (new users this month vs last month)
      Promise.all([
        prisma.user.count({
          where: { createdAt: { gte: thisMonth } }
        }),
        prisma.user.count({
          where: { createdAt: { gte: lastMonth, lt: thisMonth } }
        })
      ]),
      
      // Platform revenue (placeholder for now)
      Promise.resolve(0)
    ])

    // Calculate user growth percentage
    const [newUsersThisMonth, newUsersLastMonth] = userGrowth
    const growthPercentage = newUsersLastMonth > 0 
      ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
      : newUsersThisMonth > 0 ? 100 : 0

    const stats = {
      totalUsers,
      activeUsers,
      totalListings,
      activeListings,
      totalMessages,
      totalReviews,
      pendingModeration,
      flaggedContent,
      pendingMarketPrices,
      userGrowth: growthPercentage,
      platformRevenue
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin statistics' },
      { status: 500 }
    )
  }
}
