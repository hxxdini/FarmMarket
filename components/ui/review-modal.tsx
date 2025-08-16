'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Star, X, Send } from 'lucide-react'
import { toast } from 'sonner'

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  reviewedUserId: string
  reviewedUserName: string
  listingId: string
  listingTitle: string
  onReviewSubmitted: () => void
}

export default function ReviewModal({
  isOpen,
  onClose,
  reviewedUserId,
  reviewedUserName,
  listingId,
  listingTitle,
  onReviewSubmitted
}: ReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    if (!title.trim()) {
      toast.error('Please enter a review title')
      return
    }

    if (!comment.trim()) {
      toast.error('Please enter a review comment')
      return
    }

    setSubmitting(true)

    const reviewData = {
      reviewedId: reviewedUserId,
      listingId,
      rating,
      title: title.trim(),
      comment: comment.trim(),
      reviewType: 'TRANSACTION'
    }

    console.log('Submitting review data:', reviewData)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Failed to submit review')
        return
      }

      const data = await response.json()
      toast.success(data.message || 'Review submitted successfully and is pending admin approval!')
      onReviewSubmitted()
      onClose()
      
      // Reset form
      setRating(0)
      setTitle('')
      setComment('')
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error('Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Write a Review
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Review for <span className="font-medium text-gray-900">{reviewedUserName}</span>
            </p>
            <p className="text-xs text-gray-500">
              Product: {listingTitle}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div className="space-y-3">
                <Label htmlFor="rating" className="text-sm font-medium text-gray-700">
                  Rating *
                </Label>
                <div className="flex items-center space-x-2" id="rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-1 transition-all duration-200 ${
                        star <= rating
                          ? 'text-yellow-400 hover:text-yellow-500'
                          : 'text-gray-300 hover:text-gray-400'
                      }`}
                    >
                      <Star className={`h-8 w-8 ${star <= rating ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  {rating > 0 && (
                    <span className="text-yellow-600 font-medium">
                      {rating === 1 && 'Poor'}
                      {rating === 2 && 'Fair'}
                      {rating === 3 && 'Good'}
                      {rating === 4 && 'Very Good'}
                      {rating === 5 && 'Excellent'}
                    </span>
                  )}
                </p>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                  Review Title *
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize your experience"
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 text-right">
                  {title.length}/100
                </p>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <Label htmlFor="comment" className="text-sm font-medium text-gray-700">
                  Detailed Review *
                </Label>
                <Textarea
                  id="comment"
                  name="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your detailed experience with this seller..."
                  rows={4}
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500 resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 text-right">
                  {comment.length}/500
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || rating === 0 || !title.trim() || !comment.trim()}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium"
                >
                  {submitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Send className="h-4 w-4" />
                      <span>Submit Review</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
