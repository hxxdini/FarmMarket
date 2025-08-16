import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

// GET /api/price-alerts/[id] - Get a specific price alert
export async function GET(
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

    const priceAlert = await prisma.priceAlert.findFirst({
      where: { 
        id,
        userId: user.id
      }
    })

    if (!priceAlert) {
      return NextResponse.json(
        { error: "Price alert not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: priceAlert })
  } catch (error) {
    console.error('Error fetching price alert:', error)
    return NextResponse.json(
      { error: 'Failed to fetch price alert' },
      { status: 500 }
    )
  }
}

// PUT /api/price-alerts/[id] - Update a price alert
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
      location,
      quality,
      alertType,
      frequency,
      threshold,
      isActive
    } = body

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find the price alert and verify ownership
    const existingAlert = await prisma.priceAlert.findFirst({
      where: { 
        id,
        userId: user.id
      }
    })

    if (!existingAlert) {
      return NextResponse.json(
        { error: "Price alert not found" },
        { status: 404 }
      )
    }

    // Validation
    if (threshold && (threshold <= 0 || threshold > 100)) {
      return NextResponse.json(
        { error: "Threshold must be between 0 and 100" },
        { status: 400 }
      )
    }

    // Update the price alert
    const updatedAlert = await prisma.priceAlert.update({
      where: { id },
      data: {
        ...(cropType && { cropType: cropType.trim() }),
        ...(location && { location: location.trim() }),
        ...(quality !== undefined && { quality }),
        ...(alertType && { alertType }),
        ...(frequency && { frequency }),
        ...(threshold && { threshold: parseFloat(threshold) }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      message: "Price alert updated successfully",
      data: updatedAlert
    })
  } catch (error) {
    console.error('Error updating price alert:', error)
    return NextResponse.json(
      { error: 'Failed to update price alert' },
      { status: 500 }
    )
  }
}

// DELETE /api/price-alerts/[id] - Delete a price alert
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

    // Find the price alert and verify ownership
    const existingAlert = await prisma.priceAlert.findFirst({
      where: { 
        id,
        userId: user.id
      }
    })

    if (!existingAlert) {
      return NextResponse.json(
        { error: "Price alert not found" },
        { status: 404 }
      )
    }

    // Delete the price alert
    await prisma.priceAlert.delete({
      where: { id }
    })

    return NextResponse.json({
      message: "Price alert deleted successfully"
    })
  } catch (error) {
    console.error('Error deleting price alert:', error)
    return NextResponse.json(
      { error: 'Failed to delete price alert' },
      { status: 500 }
    )
  }
}
