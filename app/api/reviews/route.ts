import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

// GET /api/reviews - Fetch reviews with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const reviewerId = searchParams.get('reviewerId')
    const reviewedId = searchParams.get('reviewedId')
    const listingId = searchParams.get('listingId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const rating = searchParams.get('rating')
    const reviewType = searchParams.get('reviewType')

    const skip = (page - 1) * limit

    // Build where clause based on filters
    const where: any = {
      isPublic: true, // Only show approved reviews
      isModerated: true // Only show reviews that have been moderated
    }

    // Support both old userId parameter (for backward compatibility) and new specific parameters
    if (userId && !reviewerId && !reviewedId) {
      where.reviewedId = userId
    }

    if (reviewerId) {
      where.reviewerId = reviewerId
    }

    if (reviewedId) {
      where.reviewedId = reviewedId
    }

    if (listingId) {
      where.listingId = listingId
    }

    if (rating) {
      where.rating = parseInt(rating)
    }

    if (reviewType) {
      where.reviewType = reviewType
    }

    // Fetch reviews with user details
    const reviews = await prisma.review.findMany({
      where,
      include: {
        User_Review_reviewerIdToUser: {
          select: {
            id: true,
            name: true,
            avatar: true,
            location: true
          }
        },
        User_Review_reviewedIdToUser: {
          select: {
            id: true,
            name: true,
            avatar: true,
            location: true
          }
        },
        ProductListing: {
          select: {
            id: true,
            cropType: true,
            // ProductListing does not have a `title` field; use available fields
            quantity: true,
            unit: true,
            pricePerUnit: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    // Get total count for pagination
    const total = await prisma.review.count({ where })

    // Transform reviews to match frontend expectations
    const transformedReviews = reviews.map(review => ({
      ...review,
      reviewer: review.User_Review_reviewerIdToUser,
      reviewed: review.User_Review_reviewedIdToUser,
      listing: review.ProductListing
    }))

    return NextResponse.json({
      reviews: transformedReviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    console.log('Session in reviews API:', session)

    if (!session) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      )
    }

    if (!session.user) {
      return NextResponse.json(
        { error: 'No user in session' },
        { status: 401 }
      )
    }

    if (!session.user.email) {
      return NextResponse.json(
        { error: 'No email in user session' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { reviewedId, listingId, rating, title, comment, reviewType = 'TRANSACTION' } = body

    console.log('Review submission data:', {
      reviewedId,
      listingId,
      rating,
      title: title ? title.substring(0, 50) + '...' : 'MISSING',
      comment: comment ? comment.substring(0, 50) + '...' : 'MISSING',
      reviewType
    })

    // Validate required fields
    if (!reviewedId) {
      return NextResponse.json(
        { error: 'Reviewed user ID is required' },
        { status: 400 }
      )
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5 stars' },
        { status: 400 }
      )
    }

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Review title is required' },
        { status: 400 }
      )
    }

    if (!comment || !comment.trim()) {
      return NextResponse.json(
        { error: 'Review comment is required' },
        { status: 400 }
      )
    }

    // Validate reviewType against enum
    const validReviewTypes = ['TRANSACTION', 'PRODUCT', 'SERVICE', 'COMMUNICATION']
    if (reviewType && !validReviewTypes.includes(reviewType)) {
      return NextResponse.json(
        { error: 'Invalid review type' },
        { status: 400 }
      )
    }

    // Get the reviewer's user ID
    const reviewer = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!reviewer) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent self-reviewing
    if (reviewer.id === reviewedId) {
      return NextResponse.json(
        { error: 'Cannot review yourself' },
        { status: 400 }
      )
    }

    // Check if review already exists for this user/listing combination
    const existingReview = await prisma.review.findFirst({
      where: {
        reviewerId: reviewer.id,
        reviewedId,
        listingId: listingId || null
      }
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'Review already exists for this transaction' },
        { status: 400 }
      )
    }

    // Create the review (hidden until admin approval)
    const review = await prisma.review.create({
      data: {
        id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        reviewerId: reviewer.id,
        reviewedId,
        listingId,
        rating,
        title,
        comment,
        reviewType,
        isVerified: false, // Will be updated when transaction verification is implemented
        isPublic: false, // Hidden until admin approval
        isModerated: false, // Not yet reviewed by admin
        updatedAt: new Date()
      },
      include: {
        User_Review_reviewerIdToUser: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        User_Review_reviewedIdToUser: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    // Transform the response to match frontend expectations
    const transformedReview = {
      ...review,
      reviewer: review.User_Review_reviewerIdToUser,
      reviewed: review.User_Review_reviewedIdToUser
    }

    return NextResponse.json({
      message: 'Review submitted successfully and is pending admin approval',
      review: transformedReview
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}

