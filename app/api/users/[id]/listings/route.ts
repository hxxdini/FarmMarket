import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Get user's active listings
    const listings = await prisma.productListing.findMany({
      where: {
        farmerId: id,
        status: 'ACTIVE'
      },
      include: {
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
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform data for frontend
    const transformedListings = listings.map(listing => {
      // Get primary image or first image as fallback
      const primaryImage = listing.ProductImage.find(img => img.isPrimary) || listing.ProductImage[0]
      
      return {
        id: listing.id,
        title: listing.cropType,
        price: listing.pricePerUnit,
        unit: listing.unit,
        quantity: listing.quantity,
        quality: listing.quality,
        location: listing.location,
        status: listing.status.toLowerCase(),
        createdAt: listing.createdAt,
        image: primaryImage?.url || '/placeholder.svg?height=200&width=300'
      }
    })

    return NextResponse.json({ listings: transformedListings })
  } catch (error) {
    console.error('Error fetching user listings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
