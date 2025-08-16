"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StarRatingDisplay } from '@/components/ui/star-rating'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare, 
  ThumbsUp,
  Calendar,
  MapPin
} from 'lucide-react'

interface Review {
  id: string
  rating: number
  title: string
  comment: string
  reviewType: string
  createdAt: string
  reviewer: {
    id: string
    name: string
    avatar: string
    location: string
  }
  reviewed: {
    id: string
    name: string
    avatar: string
    location: string
  }
  listing?: {
    id: string
    cropType: string
    quantity?: number
    unit?: string
    pricePerUnit?: number
  }
}

interface ReviewsListProps {
  userId?: string
  listingId?: string
  title?: string
  description?: string
  showFilters?: boolean
  className?: string
  mode?: 'written' | 'received' // 'written' = reviews written by user, 'received' = reviews about user
}

export function ReviewsList({
  userId,
  listingId,
  title = "Reviews",
  description = "Customer reviews and ratings",
  showFilters = true,
  className,
  mode = 'received'
}: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalReviews, setTotalReviews] = useState(0)
  const [filters, setFilters] = useState({
    rating: '',
    reviewType: ''
  })

  const fetchReviews = async (page: number = 1) => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })

      if (userId) {
        if (mode === 'written') {
          params.append('reviewerId', userId)
        } else {
          params.append('reviewedId', userId)
        }
      }

      if (listingId) {
        params.append('listingId', listingId)
      }

      if (filters.rating) {
        params.append('rating', filters.rating)
      }

      if (filters.reviewType) {
        params.append('reviewType', filters.reviewType)
      }

      const response = await fetch(`/api/reviews?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews)
        setTotalPages(data.pagination.pages)
        setTotalReviews(data.pagination.total)
        setCurrentPage(page)
      } else {
        toast.error('Failed to fetch reviews')
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast.error('Failed to fetch reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews(1)
  }, [userId, listingId, filters, mode])

  const handleFilterChange = (filter: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filter]: value }))
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchReviews(page)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getReviewTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      TRANSACTION: 'Transaction',
      PRODUCT: 'Product',
      SERVICE: 'Service',
      COMMUNICATION: 'Communication'
    }
    return labels[type] || type
  }

  const getReviewTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      TRANSACTION: 'bg-blue-100 text-blue-800',
      PRODUCT: 'bg-green-100 text-green-800',
      SERVICE: 'bg-purple-100 text-purple-800',
      COMMUNICATION: 'bg-orange-100 text-orange-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (loading && reviews.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              {description} • {totalReviews} total reviews
            </CardDescription>
          </div>
        </div>

        {showFilters && (
          <div className="flex gap-4 pt-4">
            <select
              value={filters.rating}
              onChange={(e) => handleFilterChange('rating', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
            </select>

            <select
              value={filters.reviewType}
              onChange={(e) => handleFilterChange('reviewType', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Types</option>
              <option value="TRANSACTION">Transaction</option>
              <option value="PRODUCT">Product</option>
              <option value="SERVICE">Service</option>
              <option value="COMMUNICATION">Communication</option>
            </select>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No reviews yet</p>
            <p className="text-sm">Be the first to share your experience!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4">
                {/* Review Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.reviewer.avatar} alt={review.reviewer.name} />
                      <AvatarFallback>
                        {review.reviewer.name ? review.reviewer.name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{review.reviewer.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="h-3 w-3" />
                        {review.reviewer.location}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge className={getReviewTypeColor(review.reviewType)}>
                      {getReviewTypeLabel(review.reviewType)}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(review.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="mb-3">
                  <StarRatingDisplay rating={review.rating} size="sm" />
                </div>

                {/* Review Content */}
                <div className="space-y-2">
                  <h5 className="font-medium text-lg">{review.title}</h5>
                  <p className="text-gray-700">{review.comment}</p>
                </div>

                {/* Listing Context */}
                {review.listing && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-500">
                      Review for: <span className="font-medium">
                        {review.listing.quantity && review.listing.unit 
                          ? `${review.listing.quantity} ${review.listing.unit} of ${review.listing.cropType}`
                          : review.listing.cropType
                        }
                      </span>
                    </p>
                  </div>
                )}

                {/* Review Actions */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Helpful
                  </Button>
                  
                  <span className="text-sm text-gray-400">
                    {review.reviewer.id === review.reviewed.id ? 'Self Review' : 'Verified User'}
                  </span>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

