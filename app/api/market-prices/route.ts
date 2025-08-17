import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

// GET /api/market-prices - Fetch market prices with filtering and pagination
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const cropType = searchParams.get('cropType')
    const location = searchParams.get('location')
    const quality = searchParams.get('quality')
    const source = searchParams.get('source')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'effectiveDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const includeExpired = searchParams.get('includeExpired') === 'true'
    
    const skip = (page - 1) * limit

    // Build where clause based on filters
    const where: any = {}
    
    if (cropType) where.cropType = { contains: cropType, mode: 'insensitive' }
    if (location) where.location = { contains: location, mode: 'insensitive' }
    if (quality) where.quality = quality.toUpperCase()
    if (source) where.source = source.toUpperCase()
    if (status) where.status = status.toUpperCase()
    
    // Handle expired prices filter
    if (!includeExpired) {
      where.OR = [
        { expiryDate: null },
        { expiryDate: { gt: new Date() } }
      ]
    }

    // Build orderBy clause
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    // Fetch market prices with pagination
    const [prices, total] = await Promise.all([
      prisma.marketPrice.findMany({
        where,
        include: {
          User_MarketPrice_submittedByToUser: {
            select: {
              id: true,
              name: true,
              location: true,
              Role: {
                select: {
                  name: true
                }
              }
            }
          },
          User_MarketPrice_reviewedByToUser: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.marketPrice.count({ where })
    ])

    // Calculate regional averages for each crop type and location
    const regionalAverages = await prisma.marketPrice.groupBy({
      by: ['cropType', 'location', 'quality'],
      where: {
        status: 'APPROVED',
        isVerified: true,
        OR: [
          { expiryDate: null },
          { expiryDate: { gt: new Date() } }
        ]
      },
      _avg: {
        pricePerUnit: true
      },
      _count: {
        pricePerUnit: true
      }
    })

    // Transform data for frontend consumption
    const transformedPrices = prices.map(price => ({
      id: price.id,
      cropType: price.cropType,
      pricePerUnit: price.pricePerUnit,
      unit: price.unit,
      quality: price.quality,
      location: price.location,
      source: price.source,
      status: price.status,
      submittedBy: {
        ...price.User_MarketPrice_submittedByToUser,
        role: price.User_MarketPrice_submittedByToUser.Role?.name
      },
      reviewedBy: price.User_MarketPrice_reviewedByToUser,
      reviewNotes: price.reviewNotes,
      reviewDate: price.reviewDate,
      effectiveDate: price.effectiveDate,
      expiryDate: price.expiryDate,
      isVerified: price.isVerified,
      verificationScore: price.verificationScore,
      marketTrend: price.marketTrend,
      regionalAverage: price.regionalAverage,
      priceChange: price.priceChange,
      createdAt: price.createdAt,
      updatedAt: price.updatedAt
    }))

    return NextResponse.json({
      prices: transformedPrices,
      regionalAverages: regionalAverages.map(avg => ({
        cropType: avg.cropType,
        location: avg.location,
        quality: avg.quality,
        averagePrice: avg._avg.pricePerUnit,
        sampleCount: avg._count.pricePerUnit
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching market prices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market prices' },
      { status: 500 }
    )
  }
}

// POST /api/market-prices - Submit a new market price
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      cropType,
      pricePerUnit,
      unit,
      quality,
      location,
      source = 'FARMER_SUBMISSION',
      effectiveDate,
      expiryDate
    } = body

    // Validation
    if (!cropType || !pricePerUnit || !unit || !quality || !location) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (pricePerUnit <= 0) {
      return NextResponse.json(
        { error: "Price must be greater than 0" },
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

    // Create the market price
    console.log('Creating market price with data:', {
      cropType: cropType.trim(),
      pricePerUnit: parseFloat(pricePerUnit),
      unit: unit.trim(),
      quality,
      location: location.trim(),
      source,
      submittedBy: user.id,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : null
    })
    
    const marketPrice = await prisma.marketPrice.create({
      data: {
        id: `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        cropType: cropType.trim(),
        pricePerUnit: parseFloat(pricePerUnit),
        unit: unit.trim(),
        quality,
        location: location.trim(),
        source,
        submittedBy: user.id,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        User_MarketPrice_submittedByToUser: {
          select: {
            id: true,
            name: true,
            location: true
          }
        }
      }
    })

    // Create admin action log for new market price submission
    try {
      await prisma.adminActionLog.create({
        data: {
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          action: 'market_price_submitted',
          adminId: user.id,
          targetId: marketPrice.id,
          targetType: 'MarketPrice',
          details: `New market price submitted for ${cropType} at ${location}`,
                  timestamp: new Date()
        }
      })
    } catch (logError) {
      console.error('Error creating admin action log:', logError)
      // Don't fail the main operation if logging fails
    }

    // TODO: Emit WebSocket event for real-time price updates
    // TODO: Trigger price validation and trend analysis

    return NextResponse.json({
      message: "Market price submitted successfully",
      data: marketPrice
    }, { status: 201 })
  } catch (error) {
    console.error('Error submitting market price:', error)
    
    // Provide more specific error information
    let errorMessage = 'Failed to submit market price'
    if (error instanceof Error) {
      if (error.message.includes('prisma')) {
        console.error('Prisma error details:', error.message)
        if (error.message.includes('Unknown field')) {
          errorMessage = 'Database schema issue. Please contact support.'
        } else if (error.message.includes('connection')) {
          errorMessage = 'Database connection issue. Please try again.'
        } else {
          errorMessage = `Database error: ${error.message}`
        }
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
