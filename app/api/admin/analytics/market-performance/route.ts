import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

// GET /api/admin/analytics/market-performance - Get market performance analytics
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

    // Fetch market performance metrics
    const [
      listingMetrics,
      priceMetrics,
      regionalMetrics,
      cropPerformance,
      marketTrends,
      qualityMetrics,
      sourceMetrics
    ] = await Promise.all([
      // Listing performance metrics
      prisma.productListing.groupBy({
        by: ['status', 'cropType'],
        _count: { id: true },
        _avg: { price: true },
        where: { createdAt: { gte: startDate } }
      }),
      
      // Market price metrics
      prisma.marketPrice.groupBy({
        by: ['cropType', 'quality', 'status'],
        _count: { id: true },
        _avg: { pricePerUnit: true },
        _min: { pricePerUnit: true },
        _max: { pricePerUnit: true },
        where: { createdAt: { gte: startDate } }
      }),
      
      // Regional market performance
      prisma.marketPrice.groupBy({
        by: ['location'],
        _count: { id: true },
        _avg: { pricePerUnit: true },
        where: { 
          createdAt: { gte: startDate },
          status: 'APPROVED'
        }
      }),
      
      // Crop performance analysis
      prisma.marketPrice.groupBy({
        by: ['cropType'],
        _count: { id: true },
        _avg: { pricePerUnit: true },
        _sum: { pricePerUnit: true },
        where: { 
          createdAt: { gte: startDate },
          status: 'APPROVED'
        }
      }),
      
      // Market trends over time
      generateMarketTrends(startDate, now),
      
      // Quality-based metrics
      prisma.marketPrice.groupBy({
        by: ['quality'],
        _count: { id: true },
        _avg: { pricePerUnit: true },
        where: { 
          createdAt: { gte: startDate },
          status: 'APPROVED'
        }
      }),
      
      // Source-based metrics
      prisma.marketPrice.groupBy({
        by: ['source'],
        _count: { id: true },
        _avg: { pricePerUnit: true },
        where: { 
          createdAt: { gte: startDate },
          status: 'APPROVED'
        }
      })
    ])

    // Calculate listing performance
    const listingPerformance = listingMetrics.reduce((acc, listing) => {
      const cropType = listing.cropType
      const status = listing.status
      
      if (!acc[cropType]) {
        acc[cropType] = { active: 0, inactive: 0, total: 0, avgPrice: 0 }
      }
      
      acc[cropType].total += listing._count.id
      acc[cropType].avgPrice = listing._avg.price || 0
      
      if (status === 'ACTIVE') {
        acc[cropType].active += listing._count.id
      } else {
        acc[cropType].inactive += listing._count.id
      }
      
      return acc
    }, {} as any)

    // Calculate price volatility
    const priceVolatility = priceMetrics.map(price => {
      const avgPrice = price._avg.pricePerUnit || 0
      const minPrice = price._min.pricePerUnit || 0
      const maxPrice = price._max.pricePerUnit || 0
      const volatility = maxPrice > 0 ? ((maxPrice - minPrice) / avgPrice) * 100 : 0
      
      return {
        cropType: price.cropType,
        quality: price.quality,
        status: price.status,
        count: price._count.id,
        avgPrice,
        minPrice,
        maxPrice,
        volatility: Math.round(volatility * 100) / 100
      }
    })

    // Calculate regional performance
    const regionalPerformance = regionalMetrics.map(region => ({
      location: region.location,
      listingCount: region._count.id,
      avgPrice: region._avg.pricePerUnit || 0,
      marketActivity: region._count.id > 10 ? 'High' : region._count.id > 5 ? 'Medium' : 'Low'
    })).sort((a, b) => b.listingCount - a.listingCount)

    // Calculate crop performance rankings
    const cropPerformanceRankings = cropPerformance.map(crop => ({
      cropType: crop.cropType,
      listingCount: crop._count.id,
      avgPrice: crop._avg.pricePerUnit || 0,
      totalValue: crop._sum.pricePerUnit || 0,
      marketShare: 0 // Would need total market value
    })).sort((a, b) => b.listingCount - a.listingCount)

    return NextResponse.json({
      listingPerformance: {
        totalListings: Object.values(listingPerformance).reduce((sum: any, crop: any) => sum + crop.total, 0),
        activeListings: Object.values(listingPerformance).reduce((sum: any, crop: any) => sum + crop.active, 0),
        inactiveListings: Object.values(listingPerformance).reduce((sum: any, crop: any) => sum + crop.inactive, 0),
        byCrop: listingPerformance
      },
      priceAnalysis: {
        totalPrices: priceMetrics.reduce((sum, price) => sum + price._count.id, 0),
        avgPrice: priceMetrics.reduce((sum, price) => sum + (price._avg.pricePerUnit || 0), 0) / priceMetrics.length,
        priceVolatility,
        qualityMetrics: qualityMetrics.map(quality => ({
          quality: quality.quality,
          count: quality._count.id,
          avgPrice: quality._avg.pricePerUnit || 0
        })),
        sourceMetrics: sourceMetrics.map(source => ({
          source: source.source,
          count: source._count.id,
          avgPrice: source._avg.pricePerUnit || 0
        }))
      },
      regionalAnalysis: {
        totalRegions: regionalPerformance.length,
        topRegions: regionalPerformance.slice(0, 10),
        regionalDistribution: regionalPerformance.reduce((acc, region) => {
          acc[region.marketActivity] = (acc[region.marketActivity] || 0) + 1
          return acc
        }, {} as any)
      },
      cropAnalysis: {
        totalCrops: cropPerformanceRankings.length,
        topCrops: cropPerformanceRankings.slice(0, 10),
        cropDiversity: cropPerformanceRankings.length,
        marketConcentration: cropPerformanceRankings.slice(0, 3).reduce((sum, crop) => sum + crop.listingCount, 0) / 
                           cropPerformanceRankings.reduce((sum, crop) => sum + crop.listingCount, 0) * 100
      },
      marketTrends,
      insights: {
        bestPerformingCrop: cropPerformanceRankings[0]?.cropType || 'N/A',
        mostActiveRegion: regionalPerformance[0]?.location || 'N/A',
        priceStability: priceVolatility.filter(p => p.volatility < 20).length > priceVolatility.length / 2 ? 'Stable' : 'Volatile',
        marketHealth: regionalPerformance.filter(r => r.marketActivity === 'High').length > regionalPerformance.length / 2 ? 'Healthy' : 'Needs Attention'
      }
    })

  } catch (error) {
    console.error('Error fetching market performance analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch market performance analytics' }, { status: 500 })
  }
}

// Helper function to generate market trends over time
async function generateMarketTrends(startDate: Date, endDate: Date) {
  const trends = []
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  
  for (let day = 0; day < Math.min(totalDays, 30); day++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + day)
    const nextDate = new Date(currentDate)
    nextDate.setDate(currentDate.getDate() + 1)
    
    const [listings, prices, avgPrice] = await Promise.all([
      prisma.productListing.count({
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
      }),
      prisma.marketPrice.aggregate({
        where: {
          createdAt: {
            gte: currentDate,
            lt: nextDate
          },
          status: 'APPROVED'
        },
        _avg: { pricePerUnit: true }
      })
    ])
    
    trends.push({
      date: currentDate.toISOString().split('T')[0],
      newListings: listings,
      newPrices: prices,
      avgPrice: avgPrice._avg.pricePerUnit || 0,
      marketActivity: listings + prices
    })
  }
  
  return trends
}
