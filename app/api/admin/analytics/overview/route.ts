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
      include: { Role: true }
    })

    if (user?.Role?.name !== 'admin' && user?.Role?.name !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const timeRange = searchParams.get('timeRange') || '30d'

    // Calculate date ranges
    const now = new Date()
    let startDate: Date
    let lastPeriodStart: Date
    let daysInPeriod: number

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        lastPeriodStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        daysInPeriod = 7
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        lastPeriodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
        daysInPeriod = 30
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        lastPeriodStart = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
        daysInPeriod = 90
        break
      case '1y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        lastPeriodStart = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate())
        daysInPeriod = 365
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        lastPeriodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
        daysInPeriod = 30
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
      responseRate,
      marketPrices,
      priceAlerts,
      adminActions,
      userRoles,
      regionalData,
      timeSeriesData
    ] = await Promise.all([
      // User metrics
      prisma.user.count(),
      
      // Active users (users with activity in the time range)
      prisma.user.count({
        where: {
          OR: [
            { createdAt: { gte: startDate } },
            { updatedAt: { gte: startDate } }
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
        where: {
          OR: [
            { createdAt: { gte: startDate } },
            { updatedAt: { gte: startDate } }
          ]
        }
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
        _avg: { rating: true }
      }),
      
      // Top crops by listing count
      prisma.productListing.groupBy({
        by: ['cropType'],
        _count: { cropType: true },
        orderBy: { _count: { cropType: 'desc' } },
        take: 5
      }),
      
      // Response rate (conversations with at least 2 messages) - simplified
      prisma.conversation.count(),
      
      // Market price metrics
      prisma.marketPrice.count(),
      
      // Price alerts
      prisma.priceAlert.count(),
      
      // Admin actions
      prisma.adminActionLog.count({
        where: { timestamp: { gte: startDate } }
      }),
      
      // User role distribution
      prisma.user.groupBy({
        by: ['roleId'],
        _count: { roleId: true }
      }),
      
      // Regional data
      prisma.user.groupBy({
        by: ['location'],
        _count: { location: true },
        orderBy: { _count: { location: 'desc' } },
        take: 10
      }),
      
      // Time series data
      generateTimeSeriesData(startDate, now, daysInPeriod)
    ])

    // Calculate growth rates
    const userGrowthRate = newUsersLastPeriod > 0 ? ((newUsersThisPeriod - newUsersLastPeriod) / newUsersLastPeriod) * 100 : 0
    const listingGrowthRate = newListingsThisPeriod > 0 ? ((newListingsThisPeriod - 0) / newListingsThisPeriod) * 100 : 0

    // Calculate response rate percentage
    const totalConversations = await prisma.conversation.count()
    const responseRatePercentage = totalConversations > 0 ? (responseRate / totalConversations) * 100 : 0

    // Calculate average listing price
    const listingPrices = await prisma.productListing.aggregate({
      _avg: { pricePerUnit: true }
    })

    // Calculate market price trends
    const marketPriceTrends = await prisma.marketPrice.groupBy({
      by: ['cropType'],
      _avg: { pricePerUnit: true },
      where: { status: 'APPROVED' }
    })

    // Get role names for the role distribution
    const roleIds = [...new Set(userRoles.map(r => r.roleId))]
    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { id: true, name: true }
    })
    
    const roleMap = new Map(roles.map(r => [r.id, r.name]))

    return NextResponse.json({
      userMetrics: {
        totalUsers,
        activeUsers,
        newUsersThisPeriod,
        userGrowthRate: Math.round(userGrowthRate * 100) / 100,
        userRetentionRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
        roleDistribution: userRoles.map(role => ({
          role: roleMap.get(role.roleId) || 'Unknown',
          count: role._count.roleId
        }))
      },
      marketplaceMetrics: {
        totalListings,
        activeListings,
        newListingsThisPeriod,
        listingGrowthRate: Math.round(listingGrowthRate * 100) / 100,
        averageListingPrice: listingPrices._avg?.pricePerUnit || 0,
        topCrops: topCrops.map(crop => ({
          cropType: crop.cropType,
          count: crop._count.cropType
        })),
        marketPriceTrends: marketPriceTrends.map(trend => ({
          cropType: trend.cropType,
          averagePrice: trend._avg?.pricePerUnit || 0
        }))
      },
      engagementMetrics: {
        totalMessages,
        newMessagesThisPeriod,
        totalReviews,
        newReviewsThisPeriod,
        averageRating: averageRating._avg.rating || 0,
        responseRate: Math.round(responseRatePercentage * 100) / 100
      },
      marketDataMetrics: {
        totalMarketPrices: marketPrices,
        totalPriceAlerts: priceAlerts,
        adminActionsThisPeriod: adminActions
      },
      regionalMetrics: {
        topLocations: regionalData.map(location => ({
          location: location.location,
          userCount: location._count.location
        }))
      },
      timeSeriesData
    })

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 })
  }
}

// Helper function to generate time series data for charts
async function generateTimeSeriesData(startDate: Date, endDate: Date, daysInPeriod: number) {
  const dates: string[] = []
  const userRegistrations: number[] = []
  const newListings: number[] = []
  const messages: number[] = []
  const reviews: number[] = []
  const marketPrices: number[] = []

  for (let i = 0; i < daysInPeriod; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)
    const nextDate = new Date(currentDate)
    nextDate.setDate(currentDate.getDate() + 1)
    
    dates.push(currentDate.toISOString().split('T')[0])
    
    // Fetch data for this specific date
    const [users, listings, msgs, revs, prices] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: currentDate,
            lt: nextDate
          }
        }
      }),
      prisma.productListing.count({
        where: {
          createdAt: {
            gte: currentDate,
            lt: nextDate
          }
        }
      }),
      prisma.message.count({
        where: {
          createdAt: {
            gte: currentDate,
            lt: nextDate
          }
        }
      }),
      prisma.review.count({
        where: {
          createdAt: {
            gte: currentDate,
            lt: nextDate
          }
        }
      }),
      prisma.marketPrice.count({
        where: {
          createdAt: {
            gte: currentDate,
            lt: nextDate
          }
        }
      })
    ])
    
    userRegistrations.push(users)
    newListings.push(listings)
    messages.push(msgs)
    reviews.push(revs)
    marketPrices.push(prices)
  }

  return {
    dates,
    userRegistrations,
    newListings,
    messages,
    reviews,
    marketPrices
  }
}
