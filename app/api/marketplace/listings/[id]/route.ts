import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const listing = await prisma.productListing.findUnique({
      where: { id },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            location: true,
            avatar: true
          }
        },
        ProductImage: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            url: true,
            altText: true,
            isPrimary: true,
            order: true
          }
        }
      }
    })

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    // Get farmer rating (only from approved reviews)
    const farmerRating = await prisma.review.aggregate({
      where: {
        reviewedId: listing.User.id,
        isPublic: true,
        isModerated: true // Only show ratings from approved reviews
      },
      _avg: {
        rating: true
      },
      _count: {
        rating: true
      }
    })

    // Transform the data to match the frontend interface
    const transformedListing = {
      id: listing.id,
      title: listing.cropType,
      farmer: listing.User.name || 'Unknown Farmer',
      farmerId: listing.User.id,
      farmerAvatar: listing.User.avatar,
      farmerRating: farmerRating._avg.rating || 0,
      location: listing.location,
      price: listing.pricePerUnit,
      unit: listing.unit,
      quantity: listing.quantity,
      quality: listing.quality,
      harvestDate: listing.harvestDate?.toISOString().split('T')[0] || 'N/A',
      description: listing.description || 'No description available',
      image: listing.ProductImage.find(img => img.isPrimary)?.url || listing.ProductImage[0]?.url || '/placeholder.svg',
      images: listing.ProductImage,
      category: listing.cropType,
      status: listing.status.toLowerCase(),
      createdAt: listing.createdAt,
      availableUntil: listing.availableUntil?.toISOString().split('T')[0]
    }

    return NextResponse.json({ listing: transformedListing })
  } catch (error) {
    console.error('Error fetching listing details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const {
      cropType,
      quantity,
      unit,
      pricePerUnit,
      quality,
      location,
      description,
      harvestDate,
      availableUntil,
      status
    } = body

    // Check if listing exists and belongs to user
    const existingListing = await prisma.productListing.findFirst({
      where: {
        id,
        farmer: {
          email: session.user.email
        }
      }
    })

    if (!existingListing) {
      return NextResponse.json({ error: "Listing not found or access denied" }, { status: 404 })
    }

    // Update listing
    const updatedListing = await prisma.productListing.update({
      where: { id },
      data: {
        cropType: cropType || existingListing.cropType,
        quantity: quantity ? parseFloat(quantity) : existingListing.quantity,
        unit: unit || existingListing.unit,
        pricePerUnit: pricePerUnit ? parseFloat(pricePerUnit) : existingListing.pricePerUnit,
        quality: quality || existingListing.quality,
        location: location || existingListing.location,
        description: description !== undefined ? description : existingListing.description,
        harvestDate: harvestDate ? new Date(harvestDate) : existingListing.harvestDate,
        availableUntil: availableUntil ? new Date(availableUntil) : existingListing.availableUntil,
        status: status || existingListing.status
      },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ 
      message: "Listing updated successfully", 
      listing: updatedListing 
    })
  } catch (error) {
    console.error('Error updating listing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if listing exists and belongs to user
    const existingListing = await prisma.productListing.findFirst({
      where: {
        id,
        farmer: {
          email: session.user.email
        }
      }
    })

    if (!existingListing) {
      return NextResponse.json({ error: "Listing not found or access denied" }, { status: 404 })
    }

    // Delete listing
    await prisma.productListing.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Listing deleted successfully" })
  } catch (error) {
    console.error('Error deleting listing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
