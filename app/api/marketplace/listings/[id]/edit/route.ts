import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Get listing and verify ownership
    const listing = await prisma.productListing.findFirst({
      where: {
        id,
        farmer: {
          email: session.user.email
        }
      },
      include: {
        images: {
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
      return NextResponse.json({ error: "Listing not found or access denied" }, { status: 404 })
    }

    // Return data in the format expected by the edit page
    const editListing = {
      id: listing.id,
      cropType: listing.cropType,
      quantity: listing.quantity,
      unit: listing.unit,
      pricePerUnit: listing.pricePerUnit,
      quality: listing.quality,
      status: listing.status,
      location: listing.location,
      description: listing.description,
      harvestDate: listing.harvestDate,
      availableUntil: listing.availableUntil,
      images: listing.images
    }

    return NextResponse.json({ listing: editListing })
  } catch (error) {
    console.error('Error fetching listing for edit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
