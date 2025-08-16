import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/market-prices/analytics - Get market analytics and regional pricing data
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const cropType = searchParams.get('cropType')
    const location = searchParams.get('location')
    const timeRange = searchParams.get('timeRange') || '30' // days
    const quality = searchParams.get('quality')
    
    const days = parseInt(timeRange)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Build base where clause
    const baseWhere: any = {
      status: 'APPROVED',
      isVerified: true,
      effectiveDate: { gte: startDate },
      OR: [
        { expiryDate: null },
        { expiryDate: { gt: new Date() } }
      ]
    }

    if (cropType) baseWhere.cropType = { contains: cropType, mode: 'insensitive' }
    if (location) baseWhere.location = { contains: location, mode: 'insensitive' }
    if (quality) baseWhere.quality = quality

    // Get price trends over time
    const priceTrends = await prisma.marketPrice.groupBy({
      by: ['effectiveDate', 'cropType', 'location', 'quality'],
      where: baseWhere,
      _avg: {
        pricePerUnit: true
      },
      _count: {
        pricePerUnit: true
      },
      orderBy: {
        effectiveDate: 'asc'
      }
    })

    // Get regional price comparisons
    const regionalPrices = await prisma.marketPrice.groupBy({
      by: ['location', 'cropType', 'quality'],
      where: baseWhere,
      _avg: {
        pricePerUnit: true
      },
      _min: {
        pricePerUnit: true
      },
      _max: {
        pricePerUnit: true
      },
      _count: {
        pricePerUnit: true
      }
    })

    // Get quality-based price analysis
    const qualityAnalysis = await prisma.marketPrice.groupBy({
      by: ['quality', 'cropType', 'location'],
      where: baseWhere,
      _avg: {
        pricePerUnit: true
      },
      _count: {
        pricePerUnit: true
      }
    })

    // Get source distribution
    const sourceDistribution = await prisma.marketPrice.groupBy({
      by: ['source'],
      where: baseWhere,
      _count: {
        source: true
      }
    })

    // Calculate market volatility (price standard deviation)
    const volatilityData = await prisma.marketPrice.groupBy({
      by: ['cropType', 'location', 'quality'],
      where: baseWhere,
      _avg: {
        pricePerUnit: true
      },
      _count: {
        pricePerUnit: true
      }
    })

    // Get top performing crops by location
    const topCrops = await prisma.marketPrice.groupBy({
      by: ['cropType', 'location'],
      where: baseWhere,
      _avg: {
        pricePerUnit: true
      },
      _count: {
        pricePerUnit: true
      },
      orderBy: {
        _avg: {
          pricePerUnit: 'desc'
        }
      },
      take: 10
    })

    // Calculate price change percentages
    const priceChanges = await calculatePriceChanges(baseWhere, days)

    // Transform data for frontend consumption
    const analytics = {
      timeRange: days,
      priceTrends: priceTrends.map(trend => ({
        date: trend.effectiveDate,
        cropType: trend.cropType,
        location: trend.location,
        quality: trend.quality,
        averagePrice: trend._avg.pricePerUnit,
        sampleCount: trend._count.pricePerUnit
      })),
      regionalPrices: regionalPrices.map(region => ({
        location: region.location,
        cropType: region.cropType,
        quality: region.quality,
        averagePrice: region._avg.pricePerUnit,
        minPrice: region._min.pricePerUnit,
        maxPrice: region._max.pricePerUnit,
        sampleCount: region._count.pricePerUnit
      })),
      qualityAnalysis: qualityAnalysis.map(quality => ({
        quality: quality.quality,
        cropType: quality.cropType,
        location: quality.location,
        averagePrice: quality._avg.pricePerUnit,
        sampleCount: quality._count.pricePerUnit
      })),
      sourceDistribution: sourceDistribution.map(source => ({
        source: source.source,
        count: source._count.source
      })),
      volatility: volatilityData.map(vol => ({
        cropType: vol.cropType,
        location: vol.location,
        quality: vol.quality,
        averagePrice: vol._avg.pricePerUnit,
        sampleCount: vol._count.pricePerUnit
      })),
      topCrops: topCrops.map(crop => ({
        cropType: crop.cropType,
        location: crop.location,
        averagePrice: crop._avg.pricePerUnit,
        sampleCount: crop._count.pricePerUnit
      })),
      priceChanges,
      summary: {
        totalPrices: await prisma.marketPrice.count({ where: baseWhere }),
        uniqueCrops: await prisma.marketPrice.groupBy({
          by: ['cropType'],
          where: baseWhere,
          _count: { cropType: true }
        }).then(result => result.length),
        uniqueLocations: await prisma.marketPrice.groupBy({
          by: ['location'],
          where: baseWhere,
          _count: { location: true }
        }).then(result => result.length),
        averagePrice: await prisma.marketPrice.aggregate({
          where: baseWhere,
          _avg: { pricePerUnit: true }
        }).then(result => result._avg.pricePerUnit || 0)
      }
    }

    return NextResponse.json({ data: analytics })
  } catch (error) {
    console.error('Error fetching market analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market analytics' },
      { status: 500 }
    )
  }
}

/**
 * Calculate price changes over time periods
 */
async function calculatePriceChanges(baseWhere: any, days: number): Promise<any[]> {
  try {
    const periods = [
      { name: '7 days', days: 7 },
      { name: '14 days', days: 14 },
      { name: '30 days', days: 30 }
    ]

    const priceChanges = []

    for (const period of periods) {
      if (period.days <= days) {
        const currentStart = new Date()
        currentStart.setDate(currentStart.getDate() - period.days)
        
        const previousStart = new Date()
        previousStart.setDate(previousStart.getDate() - (period.days * 2))
        
        const currentEnd = new Date()
        currentEnd.setDate(currentEnd.getDate() - period.days)

        // Get current period prices
        const currentPrices = await prisma.marketPrice.groupBy({
          by: ['cropType', 'location', 'quality'],
          where: {
            ...baseWhere,
            effectiveDate: { gte: currentStart, lt: currentEnd }
          },
          _avg: { pricePerUnit: true }
        })

        // Get previous period prices
        const previousPrices = await prisma.marketPrice.groupBy({
          by: ['cropType', 'location', 'quality'],
          where: {
            ...baseWhere,
            effectiveDate: { gte: previousStart, lt: currentEnd }
          },
          _avg: { pricePerUnit: true }
        })

        // Calculate changes
        const changes = currentPrices.map(current => {
          const previous = previousPrices.find(p => 
            p.cropType === current.cropType && 
            p.location === current.location && 
            p.quality === current.quality
          )

          if (previous && previous._avg.pricePerUnit && current._avg.pricePerUnit) {
            const change = ((current._avg.pricePerUnit - previous._avg.pricePerUnit) / previous._avg.pricePerUnit) * 100
            return {
              period: period.name,
              cropType: current.cropType,
              location: current.location,
              quality: current.quality,
              currentPrice: current._avg.pricePerUnit,
              previousPrice: previous._avg.pricePerUnit,
              change: change,
              trend: change > 0 ? 'UP' : change < 0 ? 'DOWN' : 'STABLE'
            }
          }
          return null
        }).filter(Boolean)

        priceChanges.push(...changes)
      }
    }

    return priceChanges
  } catch (error) {
    console.error('Error calculating price changes:', error)
    return []
  }
}
