import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Sample data
    const sampleListings = [
      {
        cropType: "Maize",
        quantity: 100,
        unit: "kg",
        pricePerUnit: 2500,
        quality: "Premium",
        location: "Kampala",
        description: "Fresh maize from this season's harvest",
        harvestDate: new Date("2024-01-10"),
        availableUntil: new Date("2024-02-10"),
        status: "ACTIVE"
      },
      {
        cropType: "Beans",
        quantity: 50,
        unit: "kg",
        pricePerUnit: 4200,
        quality: "Standard",
        location: "Mbale",
        description: "Quality beans suitable for both household and commercial use",
        harvestDate: new Date("2024-01-05"),
        availableUntil: new Date("2024-02-05"),
        status: "PENDING"
      },
      {
        cropType: "Coffee",
        quantity: 25,
        unit: "kg",
        pricePerUnit: 8500,
        quality: "Premium",
        location: "Mukono",
        description: "Arabica coffee beans, freshly harvested and sun-dried",
        harvestDate: new Date("2024-01-01"),
        availableUntil: new Date("2024-03-01"),
        status: "ACTIVE"
      }
    ]

    // Create sample listings
    const createdListings = []
    for (const listingData of sampleListings) {
      const listing = await prisma.productListing.create({
        data: {
          id: `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...listingData,
          farmerId: user.id,
          updatedAt: new Date()
        }
      })
      createdListings.push(listing)
    }

    return NextResponse.json({ 
      message: "Sample listings created successfully", 
      listings: createdListings 
    }, { status: 201 })
  } catch (error) {
    console.error('Error seeding listings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
