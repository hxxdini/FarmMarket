import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

// GET /api/admin/analytics/overview - Get comprehensive analytics overview
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    })

    if (user?.role !== 'admin' && user?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const timeRange = searchParams.get('timeRange') || '30d'

    // Calculate date ranges
    const now = new Date()
    let startDate: Date
    let lastPeriodStart: Date

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        lastPeriodStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        lastPeriodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        lastPeriodStart = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        lastPeriodStart = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate())
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        lastPeriodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    }

    // Fetch all metrics in parallel
    const [
      totalUsers,
      activeUsers,
      newUsersThisPeriod,
      newUsersLastPeriod,
      totalListings,
      activeListings,
      newListingsThisPeriod,
      totalMessages,
      newMessagesThisPeriod,
      totalReviews,
      newReviewsThisPeriod,
      averageRating,
      topCrops,
      responseRate
    ] = await Promise.all([
      // User metrics
      prisma.user.count(),
      
      // Active users (users with activity in the time range)
      prisma.user.count({
        where: {
          OR: [
            { createdAt: { gte: startDate } },
            { updatedAt: { gte: startDate } },
            { lastLoginAt: { gte: startDate } }
          ]
        }
      }),
      
      // New users this period
      prisma.user.count({
        where: { createdAt: { gte: startDate } }
      }),
      
      // New users last period (for growth calculation)
      prisma.user.count({
        where: { createdAt: { gte: lastPeriodStart, lt: startDate } }
      }),
      
      // Listing metrics
      prisma.productListing.count(),
      
      // Active listings
      prisma.productListing.count({
        where: { status: 'ACTIVE' }
      }),
      
      // New listings this period
      prisma.productListing.count({
        where: { createdAt: { gte: startDate } }
      }),
      
      // Message metrics
      prisma.message.count(),
      
      // New messages this period
      prisma.message.count({
        where: { createdAt: { gte: startDate } }
      }),
      
      // Review metrics
      prisma.review.count(),
      
      // New reviews this period
      prisma.review.count({
        where: { createdAt: { gte: startDate } }
      }),
      
      // Average rating
      prisma.review.aggregate({
        where: { isPublic: true, isModerated: false },
        _avg: { rating: true }
      }),
      
      // Top crops by listing count
      prisma.productListing.groupBy({
        by: ['cropType'],
        where: { status: 'ACTIVE' },
        _count: { cropType: true },
        orderBy: { _count: { cropType: 'desc' } },
        take: 10
      }),
      
      // Response rate (placeholder - would need conversation analysis)
      Promise.resolve(85) // Mock data for now
    ])

    // Calculate growth rates
    const userGrowthRate = newUsersLastPeriod > 0 
      ? Math.round(((newUsersThisPeriod - newUsersLastPeriod) / newUsersLastPeriod) * 100)
      : newUsersThisPeriod > 0 ? 100 : 0

    // Calculate user retention (simplified - users active in last 30 days)
    const retentionDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const usersActiveLast30Days = await prisma.user.count({
      where: {
        OR: [
          { createdAt: { gte: retentionDate } },
          { updatedAt: { gte: retentionDate } },
          { lastLoginAt: { gte: retentionDate } }
        ]
      }
    })
    const userRetentionRate = totalUsers > 0 ? Math.round((usersActiveLast30Days / totalUsers) * 100) : 0

    // Calculate average listing price
    const priceData = await prisma.productListing.aggregate({
      where: { status: 'ACTIVE' },
      _avg: { pricePerUnit: true }
    })

    // Transform top crops data
    const topCropsFormatted = topCrops.map(crop => ({
      cropType: crop.cropType,
      count: crop._count.cropType
    }))

    const analytics = {
      userMetrics: {
        totalUsers,
        activeUsers,
        newUsersThisMonth: newUsersThisPeriod,
        userGrowthRate,
        userRetentionRate
      },
      marketplaceMetrics: {
        totalListings,
        activeListings,
        completedTransactions: 0, // Placeholder - would need transaction tracking
        averageListingPrice: priceData._avg.pricePerUnit || 0,
        topCrops: topCropsFormatted
      },
      engagementMetrics: {
        totalMessages,
        totalReviews,
        averageRating: averageRating._avg.rating || 0,
        responseRate
      },
      timeSeriesData: {
        dates: [], // Placeholder for chart data
        userRegistrations: [],
        newListings: [],
        messages: []
      }
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching analytics overview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics overview' },
      { status: 500 }
    )
  }
}
