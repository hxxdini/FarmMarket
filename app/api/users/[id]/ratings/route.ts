import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/users/[id]/ratings - Get rating statistics for a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get all approved reviews for this user
    const reviews = await prisma.review.findMany({
      where: {
        reviewedId: userId,
        isPublic: true,
        isModerated: true // Only show reviews that have been moderated and approved
      },
      select: {
        rating: true,
        reviewType: true,
        createdAt: true
      }
    })

    // Calculate rating statistics
    const totalReviews = reviews.length
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0

    // Rating distribution (1-5 stars)
    const ratingDistribution = {
      1: reviews.filter(r => r.rating === 1).length,
      2: reviews.filter(r => r.rating === 2).length,
      3: reviews.filter(r => r.rating === 3).length,
      4: reviews.filter(r => r.rating === 4).length,
      5: reviews.filter(r => r.rating === 5).length
    }

    // Review type distribution
    const reviewTypeDistribution = reviews.reduce((acc, review) => {
      acc[review.reviewType] = (acc[review.reviewType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Recent reviews (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentReviews = reviews.filter(review => 
      review.createdAt >= thirtyDaysAgo
    ).length

    // Verified reviews count (placeholder for future implementation)
    const verifiedReviews = 0 // Will be updated when transaction verification is implemented

    return NextResponse.json({
      userId,
      userName: user.name,
      statistics: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        ratingDistribution,
        reviewTypeDistribution,
        recentReviews,
        verifiedReviews
      }
    })
  } catch (error) {
    console.error('Error fetching user ratings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user ratings' },
      { status: 500 }
    )
  }
}

