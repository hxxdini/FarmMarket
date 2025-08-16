import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'

// GET /api/reviews/[id] - Fetch a single review
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const review = await prisma.review.findUnique({
      where: { id: params.id },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            avatar: true,
            location: true
          }
        },
        reviewed: {
          select: {
            id: true,
            name: true,
            avatar: true,
            location: true
          }
        },
        listing: {
          select: {
            id: true,
            cropType: true,
            title: true
          }
        }
      }
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Error fetching review:', error)
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    )
  }
}

// PUT /api/reviews/[id] - Update a review
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { rating, title, comment, reviewType } = body

    // Get the review
    const existingReview = await prisma.review.findUnique({
      where: { id: params.id }
    })

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
    )
    }

    // Get the user making the request
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Only the reviewer can update their review
    if (existingReview.reviewerId !== user.id) {
      return NextResponse.json(
        { error: 'Cannot update another user\'s review' },
        { status: 403 }
      )
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Update the review
    const updatedReview = await prisma.review.update({
      where: { id: params.id },
      data: {
        rating: rating || existingReview.rating,
        title: title || existingReview.title,
        comment: comment || existingReview.comment,
        reviewType: reviewType || existingReview.reviewType,
        updatedAt: new Date()
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        reviewed: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Review updated successfully',
      review: updatedReview
    })
  } catch (error) {
    console.error('Error updating review:', error)
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    )
  }
}

// DELETE /api/reviews/[id] - Delete a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the review
    const existingReview = await prisma.review.findUnique({
      where: { id: params.id }
    })

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Get the user making the request
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Only the reviewer can delete their review
    if (existingReview.reviewerId !== user.id) {
      return NextResponse.json(
        { error: 'Cannot delete another user\'s review' },
        { status: 403 }
      )
    }

    // Delete the review
    await prisma.review.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Review deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}

