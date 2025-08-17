import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

// GET /api/admin/analytics/user-behavior - Get user behavior analytics
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

    const { searchParams } = new URL(req.url)
    const timeRange = searchParams.get('timeRange') || '30d'

    // Calculate date ranges
    const now = new Date()
    let startDate: Date

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Fetch user behavior metrics
    const [
      totalSessions,
      activeUsers,
      userEngagement,
      topPerformingUsers,
      userRetention,
      userActivityPatterns,
      conversionMetrics
    ] = await Promise.all([
      // Total sessions (approximated by user activity)
      prisma.user.count({
        where: {
          OR: [
            { createdAt: { gte: startDate } },
            { updatedAt: { gte: startDate } }
          ]
        }
      }),
      
      // Active users in the period
      prisma.user.count({
        where: {
          OR: [
            { createdAt: { gte: startDate } },
            { updatedAt: { gte: startDate } }
          ]
        }
      }),
      
      // User engagement metrics
      prisma.user.findMany({
        where: {
          OR: [
            { createdAt: { gte: startDate } },
            { updatedAt: { gte: startDate } }
          ]
        },
        include: {
          ProductListing: true,
          Message: true,
          Review: true,
          MarketPrice: true
        }
      }),
      
      // Top performing users
      prisma.user.findMany({
        where: {
          OR: [
            { createdAt: { gte: startDate } },
            { updatedAt: { gte: startDate } }
          ]
        },
        include: {
          _count: {
            select: {
              ProductListing: true,
              Message: true,
              Review: true,
              MarketPrice: true
            }
          }
        },
        orderBy: {
          ProductListing: {
            _count: 'desc'
          }
        },
        take: 10
      }),
      
      // User retention analysis
      prisma.user.groupBy({
        by: ['createdAt'],
        _count: { createdAt: true },
        where: { createdAt: { gte: startDate } }
      }),
      
      // User activity patterns by hour
      generateHourlyActivityPatterns(startDate, now),
      
      // Conversion metrics
      prisma.user.aggregate({
        where: {
          createdAt: { gte: startDate }
        },
        _count: { id: true }
      })
    ])

    // Calculate engagement scores
    const engagementScores = userEngagement.map(user => {
      const listingScore = user.ProductListing.length * 2
      const messageScore = user.Message.length * 1
      const reviewScore = user.Review.length * 3
      const priceScore = user.MarketPrice.length * 2
      const totalScore = listingScore + messageScore + reviewScore + priceScore
      
      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        location: user.location,
        totalScore,
        listingScore,
        messageScore,
        reviewScore,
        priceScore,
        activityCount: user.ProductListing.length + user.Message.length + user.Review.length + user.MarketPrice.length
      }
    }).sort((a, b) => b.totalScore - a.totalScore)

    // Calculate retention rates
    const retentionRates = calculateRetentionRates(userRetention, startDate, now)

    return NextResponse.json({
      sessionMetrics: {
        totalSessions,
        activeUsers,
        averageSessionDuration: 0, // Would need session tracking
        bounceRate: 0 // Would need session tracking
      },
      engagementMetrics: {
        totalUsers: userEngagement.length,
        averageEngagementScore: engagementScores.reduce((sum, user) => sum + user.totalScore, 0) / engagementScores.length,
        topEngagedUsers: engagementScores.slice(0, 10),
        engagementDistribution: {
          high: engagementScores.filter(u => u.totalScore >= 20).length,
          medium: engagementScores.filter(u => u.totalScore >= 10 && u.totalScore < 20).length,
          low: engagementScores.filter(u => u.totalScore < 10).length
        }
      },
      userBehavior: {
        topPerformingUsers: topPerformingUsers.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          listingCount: user._count.ProductListing,
          messageCount: user._count.Message,
          reviewCount: user._count.Review,
          priceCount: user._count.MarketPrice,
          totalActivity: user._count.ProductListing + user._count.Message + user._count.Review + user._count.MarketPrice
        })),
        activityPatterns: userActivityPatterns,
        retentionRates
      },
      conversionMetrics: {
        newUserSignups: conversionMetrics._count.id,
        activeUserRate: activeUsers > 0 ? (activeUsers / totalSessions) * 100 : 0,
        engagementRate: userEngagement.length > 0 ? (engagementScores.filter(u => u.totalScore > 0).length / userEngagement.length) * 100 : 0
      }
    })

  } catch (error) {
    console.error('Error fetching user behavior analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch user behavior analytics' }, { status: 500 })
  }
}

// Helper function to generate hourly activity patterns
async function generateHourlyActivityPatterns(startDate: Date, endDate: Date) {
  const patterns = []
  
  for (let hour = 0; hour < 24; hour++) {
    const [listings, messages, reviews, prices] = await Promise.all([
      prisma.productListing.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      prisma.message.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      prisma.review.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      prisma.marketPrice.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      })
    ])
    
    patterns.push({
      hour: hour.toString().padStart(2, '0') + ':00',
      listings,
      messages,
      reviews,
      prices,
      total: listings + messages + reviews + prices
    })
  }
  
  return patterns
}

// Helper function to calculate retention rates
function calculateRetentionRates(userRetention: any[], startDate: Date, endDate: Date) {
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const retentionRates = []
  
  for (let day = 1; day <= Math.min(totalDays, 30); day++) {
    const dayDate = new Date(startDate)
    dayDate.setDate(startDate.getDate() + day)
    
    const usersOnDay = userRetention.filter(user => {
      const userDate = new Date(user.createdAt)
      return userDate <= dayDate
    }).length
    
    retentionRates.push({
      day,
      users: usersOnDay,
      retentionRate: userRetention.length > 0 ? (usersOnDay / userRetention.length) * 100 : 0
    })
  }
  
  return retentionRates
}
