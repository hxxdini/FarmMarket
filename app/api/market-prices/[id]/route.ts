import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

// GET /api/market-prices/[id] - Get a specific market price
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    const marketPrice = await prisma.marketPrice.findUnique({
      where: { id },
      include: {
        User_MarketPrice_submittedByToUser: {
          select: {
            id: true,
            name: true,
            location: true
          }
        },
        User_MarketPrice_reviewedByToUser: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!marketPrice) {
      return NextResponse.json(
        { error: "Market price not found" },
        { status: 404 }
      )
    }

    // Transform to match frontend expectations
    const transformed = {
      id: marketPrice.id,
      cropType: marketPrice.cropType,
      pricePerUnit: marketPrice.pricePerUnit,
      unit: marketPrice.unit,
      quality: marketPrice.quality,
      location: marketPrice.location,
      source: marketPrice.source,
      status: marketPrice.status,
      submittedBy: marketPrice.User_MarketPrice_submittedByToUser,
      reviewedBy: marketPrice.User_MarketPrice_reviewedByToUser,
      reviewNotes: marketPrice.reviewNotes,
      reviewDate: marketPrice.reviewDate,
      effectiveDate: marketPrice.effectiveDate,
      expiryDate: marketPrice.expiryDate,
      isVerified: marketPrice.isVerified,
      verificationScore: marketPrice.verificationScore,
      marketTrend: marketPrice.marketTrend,
      regionalAverage: marketPrice.regionalAverage,
      priceChange: marketPrice.priceChange,
      createdAt: marketPrice.createdAt,
      updatedAt: marketPrice.updatedAt
    }

    return NextResponse.json({ data: transformed })
  } catch (error) {
    console.error('Error fetching market price:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market price' },
      { status: 500 }
    )
  }
}

// PUT /api/market-prices/[id] - Update a market price
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const body = await req.json()
    const {
      cropType,
      pricePerUnit,
      unit,
      quality,
      location,
      source,
      effectiveDate,
      expiryDate
    } = body

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { Role: true }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find the market price and verify ownership or admin status
    const existingPrice = await prisma.marketPrice.findUnique({
      where: { id }
    })

    if (!existingPrice) {
      return NextResponse.json(
        { error: "Market price not found" },
        { status: 404 }
      )
    }

    // Only allow updates if user is the submitter or has admin role
    const isAdmin = user.Role?.name === 'admin' || user.Role?.name === 'superadmin'
    if (existingPrice.submittedBy !== user.id && !isAdmin) {
      return NextResponse.json(
        { error: "Access denied. Only the submitter or admin can update this price" },
        { status: 403 }
      )
    }

    // Validation
    if (pricePerUnit && pricePerUnit <= 0) {
      return NextResponse.json(
        { error: "Price must be greater than 0" },
        { status: 400 }
      )
    }

    // Update the market price and reset status to pending for review
    const updatedPrice = await prisma.marketPrice.update({
      where: { id },
      data: {
        ...(cropType && { cropType: cropType.trim() }),
        ...(pricePerUnit && { pricePerUnit: parseFloat(pricePerUnit) }),
        ...(unit && { unit: unit.trim() }),
        ...(quality && { quality }),
        ...(location && { location: location.trim() }),
        ...(source && { source }),
        ...(effectiveDate && { effectiveDate: new Date(effectiveDate) }),
        ...(expiryDate && { expiryDate: new Date(expiryDate) }),
        status: 'PENDING', // Reset to pending for review
        reviewedBy: null, // Clear previous review
        reviewDate: null, // Clear previous review date
        reviewNotes: null, // Clear previous review notes
        isVerified: false, // Reset verification status
        verificationScore: 0.0, // Reset verification score
        updatedAt: new Date()
      },
      include: {
        User_MarketPrice_submittedByToUser: {
          select: {
            id: true,
            name: true,
            location: true
          }
        },
        User_MarketPrice_reviewedByToUser: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      message: "Market price updated successfully",
      data: updatedPrice
    })
  } catch (error) {
    console.error('Error updating market price:', error)
    return NextResponse.json(
      { error: 'Failed to update market price' },
      { status: 500 }
    )
  }
}

// DELETE /api/market-prices/[id] - Delete a market price
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find the market price and verify ownership or admin status
    const existingPrice = await prisma.marketPrice.findUnique({
      where: { id }
    })

    if (!existingPrice) {
      return NextResponse.json(
        { error: "Market price not found" },
        { status: 404 }
      )
    }

    // Only allow deletion if user is the submitter or has admin role
    const isAdmin = user.Role?.name === 'admin' || user.Role?.name === 'superadmin'
    if (existingPrice.submittedBy !== user.id && !isAdmin) {
      return NextResponse.json(
        { error: "Access denied. Only the submitter or admin can delete this price" },
        { status: 403 }
      )
    }

    // Delete the market price
    await prisma.marketPrice.delete({
      where: { id }
    })

    return NextResponse.json({
      message: "Market price deleted successfully"
    })
  } catch (error) {
    console.error('Error deleting market price:', error)
    return NextResponse.json(
      { error: 'Failed to delete market price' },
      { status: 500 }
    )
  }
}
