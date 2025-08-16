"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StarRatingDisplay } from '@/components/ui/star-rating'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Star, Users, Award, TrendingUp } from 'lucide-react'

interface UserRatingStats {
  userId: string
  userName: string
  statistics: {
    totalReviews: number
    averageRating: number
    ratingDistribution: {
      1: number
      2: number
      3: number
      4: number
      5: number
    }
    reviewTypeDistribution: Record<string, number>
    recentReviews: number
    verifiedReviews: number
  }
}

interface UserRatingSummaryProps {
  userId: string
  className?: string
}

export function UserRatingSummary({ userId, className }: UserRatingSummaryProps) {
  const [stats, setStats] = useState<UserRatingStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserRatings()
  }, [userId])

  const fetchUserRatings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${userId}/ratings`)
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        toast.error('Failed to fetch user ratings')
      }
    } catch (error) {
      console.error('Error fetching user ratings:', error)
      toast.error('Failed to fetch user ratings')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Rating Summary</CardTitle>
          <CardDescription>User rating statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8 text-gray-500">
          <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No rating data available</p>
        </CardContent>
      </Card>
    )
  }

  const { statistics } = stats
  const totalReviews = statistics.totalReviews
  const averageRating = statistics.averageRating

  // Calculate percentage for each rating
  const getRatingPercentage = (rating: number) => {
    return totalReviews > 0 ? (statistics.ratingDistribution[rating as keyof typeof statistics.ratingDistribution] / totalReviews) * 100 : 0
  }

  // Get rating label
  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return 'Excellent'
    if (rating >= 4.0) return 'Very Good'
    if (rating >= 3.5) return 'Good'
    if (rating >= 3.0) return 'Fair'
    if (rating >= 2.0) return 'Poor'
    return 'Very Poor'
  }

  // Get rating color
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 4.0) return 'text-green-500'
    if (rating >= 3.5) return 'text-yellow-600'
    if (rating >= 3.0) return 'text-yellow-500'
    if (rating >= 2.0) return 'text-orange-500'
    return 'text-red-500'
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Rating Summary
        </CardTitle>
        <CardDescription>
          Rating statistics for {stats.userName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Rating */}
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="text-4xl font-bold text-gray-900">
              {averageRating.toFixed(1)}
            </div>
            <div className="text-right">
              <StarRatingDisplay rating={averageRating} size="lg" />
              <p className="text-sm text-gray-600 mt-1">
                {getRatingLabel(averageRating)}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-3">
          <h4 className="font-medium">Rating Distribution</h4>
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-16">
                <span className="text-sm font-medium">{rating}</span>
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
              </div>
              <Progress 
                value={getRatingPercentage(rating)} 
                className="flex-1 h-2"
              />
              <span className="text-sm text-gray-600 w-12 text-right">
                {statistics.ratingDistribution[rating as keyof typeof statistics.ratingDistribution]}
              </span>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-900">
              {totalReviews}
            </div>
            <p className="text-sm text-blue-700">Total Reviews</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-900">
              {statistics.recentReviews}
            </div>
            <p className="text-sm text-green-700">Recent (30 days)</p>
          </div>
        </div>

        {/* Review Type Distribution */}
        {Object.keys(statistics.reviewTypeDistribution).length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Review Types</h4>
            <div className="space-y-2">
              {Object.entries(statistics.reviewTypeDistribution).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <Badge variant="outline" className="capitalize">
                    {type.toLowerCase()}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {count} review{count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verification Status */}
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-5 w-5 text-yellow-600" />
            <h4 className="font-medium text-yellow-800">Verification Status</h4>
          </div>
          <p className="text-sm text-yellow-700">
            {statistics.verifiedReviews} out of {totalReviews} reviews are verified transactions
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

