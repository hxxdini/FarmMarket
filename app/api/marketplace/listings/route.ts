import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const location = searchParams.get('location') || ''
    const quality = searchParams.get('quality') || ''
    const minPrice = searchParams.get('minPrice') || ''
    const maxPrice = searchParams.get('maxPrice') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    // Build where clause for filtering
    const where: any = {
      status: 'ACTIVE' // Only show active listings
    }

    if (search) {
      where.OR = [
        { cropType: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { User: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (category && category !== 'all') {
      where.cropType = { contains: category, mode: 'insensitive' }
    }

    if (location && location !== 'all') {
      where.location = { contains: location, mode: 'insensitive' }
    }

    if (quality && quality !== 'all') {
      where.quality = quality
    }

    if (minPrice) {
      where.pricePerUnit = { ...where.pricePerUnit, gte: parseFloat(minPrice) }
    }

    if (maxPrice) {
      where.pricePerUnit = { ...where.pricePerUnit, lte: parseFloat(maxPrice) }
    }

    // Get total count for pagination
    const totalCount = await prisma.productListing.count({ where })

    // Get listings with farmer information
    const listings = await prisma.productListing.findMany({
      where,
      include: { 
        User: { select: { id: true, name: true, email: true, location: true, avatar: true } },
        ProductImage: {
          orderBy: [
            { isPrimary: 'desc' },
            { order: 'asc' }
          ],
          select: {
            id: true,
            url: true,
            altText: true,
            isPrimary: true,
            order: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    // Get ratings for all farmers in the listings (only approved reviews)
    const farmerIds = [...new Set(listings.map(listing => listing.User.id))]
    const ratings = await prisma.review.groupBy({
      by: ['reviewedId'],
      where: {
        reviewedId: { in: farmerIds },
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

    // Create a map of farmer ratings
    const farmerRatings = new Map()
    ratings.forEach(rating => {
      farmerRatings.set(rating.reviewedId, {
        averageRating: rating._avg.rating || 0,
        totalReviews: rating._count.rating
      })
    })

    // Transform data for frontend
    const transformedListings = listings.map(listing => {
      // Get primary image or first image as fallback
      const primaryImage = listing.ProductImage.find(img => img.isPrimary) || listing.ProductImage[0]
      
      return {
        id: listing.id,
        title: listing.cropType,
        farmer: listing.User.name || 'Unknown Farmer',
        farmerId: listing.User.id,
        farmerAvatar: listing.User.avatar,
        farmerRating: farmerRatings.get(listing.User.id)?.averageRating || 0,
        location: listing.location,
        price: listing.pricePerUnit,
        unit: listing.unit,
        quantity: listing.quantity,
        quality: listing.quality,
        harvestDate: listing.harvestDate?.toISOString().split('T')[0] || 'N/A',
        description: listing.description || 'No description available',
        image: primaryImage?.url || '/placeholder.svg?height=200&width=300', // Use actual image or placeholder
        images: listing.ProductImage, // Include all images
        category: listing.cropType,
        status: listing.status.toLowerCase(),
        createdAt: listing.createdAt,
        availableUntil: listing.availableUntil
      }
    })

    return NextResponse.json({
      listings: transformedListings,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching marketplace listings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
      availableUntil
    } = body

    // Validation
    if (!cropType || !quantity || !unit || !pricePerUnit || !quality || !location) {
      return NextResponse.json({ 
        error: "Missing required fields: cropType, quantity, unit, pricePerUnit, quality, location" 
      }, { status: 400 })
    }

    if (parseFloat(quantity) <= 0 || parseFloat(pricePerUnit) <= 0) {
      return NextResponse.json({ 
        error: "Quantity and price must be greater than 0" 
      }, { status: 400 })
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

        // Create listing
    const listing = await prisma.productListing.create({
      data: {
        id: `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        cropType,
        quantity: parseFloat(quantity),
        unit,
        pricePerUnit: parseFloat(pricePerUnit),
        farmerId: user.id,
        quality,
        location,
        description: description || null,
        harvestDate: harvestDate ? new Date(harvestDate) : null,
        availableUntil: availableUntil ? new Date(availableUntil) : null,
        updatedAt: new Date()
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ 
      message: "Listing created successfully", 
      listing 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating listing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
