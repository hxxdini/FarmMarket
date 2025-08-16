"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StarRating } from '@/components/ui/star-rating'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Send } from 'lucide-react'

interface ReviewFormProps {
  reviewedUserId: string
  reviewedUserName: string
  listingId?: string
  listingTitle?: string
  onReviewSubmitted?: () => void
  onCancel?: () => void
}

interface ReviewData {
  rating: number
  title: string
  comment: string
  reviewType: string
}

export function ReviewForm({
  reviewedUserId,
  reviewedUserName,
  listingId,
  listingTitle,
  onReviewSubmitted,
  onCancel
}: ReviewFormProps) {
  const [formData, setFormData] = useState<ReviewData>({
    rating: 0,
    title: '',
    comment: '',
    reviewType: 'TRANSACTION'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }))
  }

  const handleInputChange = (field: keyof ReviewData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.rating === 0) {
      toast.error('Please select a rating')
      return
    }

    if (!formData.title.trim()) {
      toast.error('Please provide a review title')
      return
    }

    if (!formData.comment.trim()) {
      toast.error('Please provide a review comment')
      return
    }

    setIsSubmitting(true)

    const reviewData = {
      reviewedId: reviewedUserId,
      listingId,
      rating: formData.rating,
      title: formData.title.trim(),
      comment: formData.comment.trim(),
      reviewType: formData.reviewType
    }

    console.log('Submitting review data:', reviewData)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || 'Review submitted successfully and is pending admin approval!')
        setFormData({
          rating: 0,
          title: '',
          comment: '',
          reviewType: 'TRANSACTION'
        })
        onReviewSubmitted?.()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error('Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
        <CardDescription>
          Share your experience with {reviewedUserName}
          {listingTitle && ` regarding "${listingTitle}"`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Selection */}
          <div className="space-y-3">
            <Label htmlFor="rating">Rating *</Label>
            <div className="flex items-center gap-4" id="rating">
              <StarRating
                rating={formData.rating}
                onRatingChange={handleRatingChange}
                size="lg"
                showValue={true}
              />
              <span className="text-sm text-gray-500">
                {formData.rating === 0 && 'Click to select rating'}
                {formData.rating > 0 && `${formData.rating} out of 5 stars`}
              </span>
            </div>
          </div>

          {/* Review Type */}
          <div className="space-y-2">
            <Label htmlFor="reviewType">Review Type</Label>
            <Select
              value={formData.reviewType}
              onValueChange={(value) => handleInputChange('reviewType', value)}
            >
              <SelectTrigger id="reviewType" name="reviewType">
                <SelectValue placeholder="Select review type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRANSACTION">Transaction</SelectItem>
                <SelectItem value="PRODUCT">Product</SelectItem>
                <SelectItem value="SERVICE">Service</SelectItem>
                <SelectItem value="COMMUNICATION">Communication</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Review Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Review Title *</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Brief summary of your experience"
              maxLength={100}
            />
            <span className="text-xs text-gray-500">
              {formData.title.length}/100 characters
            </span>
          </div>

          {/* Review Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Review Comment *</Label>
            <Textarea
              id="comment"
              name="comment"
              value={formData.comment}
              onChange={(e) => handleInputChange('comment', e.target.value)}
              placeholder="Share details about your experience..."
              rows={4}
              maxLength={500}
            />
            <span className="text-xs text-gray-500">
              {formData.comment.length}/500 characters
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || formData.rating === 0}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

