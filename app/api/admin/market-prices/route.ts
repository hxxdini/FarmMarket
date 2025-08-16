import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

// GET /api/admin/market-prices - Fetch market prices for admin review
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
    const cropType = searchParams.get('cropType')
    const location = searchParams.get('location')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    const skip = (page - 1) * limit

    // Build where clause based on filters
    const where: any = {}
    
    if (status !== 'all') where.status = status
    if (cropType) where.cropType = { contains: cropType, mode: 'insensitive' }
    if (location) where.location = { contains: location, mode: 'insensitive' }

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
              email: true
            }
          },
          User_MarketPrice_reviewedByToUser: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.marketPrice.count({ where })
    ])

    // Calculate statistics
    const stats = await prisma.marketPrice.groupBy({
      by: ['status'],
      _count: { status: true }
    })

    const statusCounts = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      prices,
      stats: {
        total: total,
        pending: statusCounts.PENDING || 0,
        approved: statusCounts.APPROVED || 0,
        rejected: statusCounts.REJECTED || 0,
        expired: statusCounts.EXPIRED || 0
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching admin market prices:', error)
    
    // Provide more specific error information
    let errorMessage = 'Failed to fetch admin market prices'
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

// POST /api/admin/market-prices - Bulk actions on market prices
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { Role: true }
    })

    if (user?.Role.name !== 'admin' && user?.Role.name !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 })
    }

    const body = await req.json()
    const { action, priceIds, reviewNotes } = body

    if (!action || !priceIds || !Array.isArray(priceIds)) {
      return NextResponse.json(
        { error: "Invalid request. Action and priceIds array required." },
        { status: 400 }
      )
    }

    let updateData: any = {}
    let actionType = ''

    switch (action) {
      case 'approve':
        updateData = {
          status: 'APPROVED',
          reviewedBy: user.id,
          reviewDate: new Date(),
          reviewNotes: reviewNotes || null,
          isVerified: true,
          verificationScore: 1.0
        }
        actionType = 'APPROVE_MARKET_PRICES'
        break
      
      case 'reject':
        updateData = {
          status: 'REJECTED',
          reviewedBy: user.id,
          reviewDate: new Date(),
          reviewNotes: reviewNotes || null,
          isVerified: false,
          verificationScore: 0.0
        }
        actionType = 'REJECT_MARKET_PRICES'
        break
      
      case 'expire':
        updateData = {
          status: 'EXPIRED',
          reviewedBy: user.id,
          reviewDate: new Date(),
          reviewNotes: reviewNotes || null
        }
        actionType = 'EXPIRE_MARKET_PRICES'
        break
      
      default:
        return NextResponse.json(
          { error: "Invalid action. Must be 'approve', 'reject', or 'expire'." },
          { status: 400 }
        )
    }

    // Update all specified prices
    const updatedPrices = await prisma.marketPrice.updateMany({
      where: {
        id: { in: priceIds }
      },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    })

    // Log admin action
    await prisma.adminActionLog.create({
      data: {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        adminId: user.id,
        action: actionType,
        targetType: 'MARKET_PRICE',
        targetId: priceIds.join(','),
        details: JSON.stringify({
          action,
          priceIds,
          reviewNotes: reviewNotes || null,
          affectedCount: updatedPrices.count
        }),
        timestamp: new Date(),
        ipAddress: null,
        userAgent: null
      }
    })

    return NextResponse.json({
      message: `Successfully ${action}d ${updatedPrices.count} market prices`,
      affectedCount: updatedPrices.count
    })
  } catch (error) {
    console.error('Error performing bulk action on market prices:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk action on market prices' },
      { status: 500 }
    )
  }
}
