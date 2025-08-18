"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StarRatingDisplay } from "@/components/ui/star-rating"
import { toast } from "sonner"
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  AlertTriangle, 
  Shield,
  Loader2,
  Search
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Review {
  id: string
  rating: number
  title: string
  comment: string
  reviewType: string
  isPublic: boolean
  isModerated: boolean
  moderationReason?: string
  createdAt: string
  User_Review_reviewerIdToUser: {
    id: string
    name: string
    avatar: string
    email: string
  }
  User_Review_reviewedIdToUser: {
    id: string
    name: string
    avatar: string
  }
  ProductListing?: {
    id: string
    cropType: string
    quantity: number
    unit: string
  }
}

export default function ReviewModerationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filtering, setFiltering] = useState(false)
  const [moderating, setModerating] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    status: 'pending',
    reviewType: 'all',
    search: ''
  })

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (status === "authenticated") {
        setFiltering(true)
        fetchReviews()
      }
    }, 300) // 300ms delay

    return () => clearTimeout(timeoutId)
  }, [filters.search])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      // Check if user is admin
      if ((session?.user as any)?.role !== 'admin' && (session?.user as any)?.role !== 'superadmin') {
        router.replace("/")
        toast.error("Access denied. Admin privileges required.")
        return
      }
      fetchReviews()
    }
  }, [status, session, router, filters])

  const fetchReviews = async () => {
    try {
      if (!filtering) {
        setLoading(true)
      }
      const params = new URLSearchParams({
        status: filters.status,
        reviewType: filters.reviewType,
        search: filters.search
      })
      
      const response = await fetch(`/api/admin/moderation/reviews?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews)
      } else {
        const error = await response.json()
        console.error('Failed to fetch reviews:', error)
        toast.error(`Failed to fetch reviews: ${error.details || error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast.error('Failed to fetch reviews')
    } finally {
      setLoading(false)
      setFiltering(false)
    }
  }

  const handleModeration = async (reviewId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      setModerating(reviewId)
      
      const response = await fetch(`/api/admin/moderation/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason })
      })

      if (response.ok) {
        toast.success(`Review ${action === 'approve' ? 'approved' : 'rejected'} successfully`)
        // Remove the moderated review from the list
        setReviews(prev => prev.filter(review => review.id !== reviewId))
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to moderate review')
      }
    } catch (error) {
      console.error('Error moderating review:', error)
      toast.error('Failed to moderate review')
    } finally {
      setModerating(null)
    }
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading review moderation...</span>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {filters.status === 'pending' ? 'Review Moderation' :
                 filters.status === 'approved' ? 'Approved Reviews' :
                 filters.status === 'rejected' ? 'Rejected Reviews' :
                 filters.status === 'flagged' ? 'Flagged Reviews' :
                 'All Reviews'}
              </h1>
              <p className="text-base sm:text-lg text-gray-600">
                {filters.status === 'pending' ? 'Moderate user reviews and maintain platform quality' :
                 filters.status === 'approved' ? 'View and manage approved reviews' :
                 filters.status === 'rejected' ? 'View and manage rejected reviews' :
                 filters.status === 'flagged' ? 'Review flagged content for moderation' :
                 'View and manage all reviews on the platform'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={`text-center sm:text-left ${
                filters.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                filters.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                filters.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                filters.status === 'flagged' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                'bg-gray-50 text-gray-700 border-gray-200'
              }`}>
                <Shield className="h-4 w-4 mr-1" />
                {reviews.length} {filters.status === 'pending' ? 'Pending' :
                                 filters.status === 'approved' ? 'Approved' :
                                 filters.status === 'rejected' ? 'Rejected' :
                                 filters.status === 'flagged' ? 'Flagged' :
                                 'Total'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
            <CardTitle className="text-base sm:text-lg">Filters</CardTitle>
            <CardDescription className="text-sm">Filter reviews by status, type, and content</CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label htmlFor="filterStatus" className="text-sm font-medium">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger id="filterStatus" name="filterStatus" className="h-9 sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending Approval</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="flagged">Flagged Content</SelectItem>
                    <SelectItem value="all">All Reviews</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="filterReviewType" className="text-sm font-medium">Review Type</label>
                <Select value={filters.reviewType} onValueChange={(value) => setFilters(prev => ({ ...prev, reviewType: value }))}>
                  <SelectTrigger id="filterReviewType" name="filterReviewType" className="h-9 sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="TRANSACTION">Transaction</SelectItem>
                    <SelectItem value="PRODUCT">Product</SelectItem>
                    <SelectItem value="SERVICE">Service</SelectItem>
                    <SelectItem value="COMMUNICATION">Communication</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="sm:col-span-2 lg:col-span-1">
                <label htmlFor="search" className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    name="search"
                    placeholder="Search reviews..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10 h-9 sm:h-10"
                  />
                  {filtering && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                  )}
                </div>
              </div>
              

            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <Card className="text-center py-12">
              {filters.status === 'pending' ? (
                <>
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending reviews</h3>
                  <p className="text-gray-500">All reviews have been processed. Great job!</p>
                </>
              ) : filters.status === 'approved' ? (
                <>
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No approved reviews</h3>
                  <p className="text-gray-500">No reviews have been approved yet.</p>
                </>
              ) : filters.status === 'rejected' ? (
                <>
                  <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No rejected reviews</h3>
                  <p className="text-gray-500">No reviews have been rejected yet.</p>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
                  <p className="text-gray-500">No reviews match the current filters.</p>
                </>
              )}
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reviewer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Review Content
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Context
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reviews.map((review) => (
                      <tr key={review.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={review.User_Review_reviewerIdToUser.avatar} alt={review.User_Review_reviewerIdToUser.name} />
                              <AvatarFallback className="text-xs">
                                {review.User_Review_reviewerIdToUser.name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{review.User_Review_reviewerIdToUser.name}</div>
                              <div className="text-xs text-gray-500">{review.User_Review_reviewerIdToUser.email}</div>
                              <div className="text-xs text-gray-400">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="max-w-[300px]">
                            <div className="flex items-center space-x-2 mb-1">
                              <StarRatingDisplay rating={review.rating} size="sm" />
                              <Badge className={getReviewTypeColor(review.reviewType)}>
                                {getReviewTypeLabel(review.reviewType)}
                              </Badge>
                            </div>
                            <div className="text-sm font-medium text-gray-900 mb-1">{review.title}</div>
                            <div className="text-xs text-gray-600 line-clamp-2">{review.comment}</div>
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">Reviewing:</span>
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={review.User_Review_reviewedIdToUser.avatar} alt={review.User_Review_reviewedIdToUser.name} />
                                  <AvatarFallback className="text-xs">
                                    {review.User_Review_reviewedIdToUser.name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium">{review.User_Review_reviewedIdToUser.name}</span>
                              </div>
                            </div>
                            
                            {review.ProductListing && (
                              <div className="text-xs">
                                <span className="text-gray-500">Product: </span>
                                <span className="font-medium">
                                  {review.ProductListing.quantity} {review.ProductListing.unit} of {review.ProductListing.cropType}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="space-y-1">
                            {!review.isModerated ? (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            ) : review.isPublic ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approved
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800 border-red-200">
                                <XCircle className="h-3 w-3 mr-1" />
                                Rejected
                              </Badge>
                            )}
                            
                            {review.moderationReason && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Flagged
                              </Badge>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/users/${review.User_Review_reviewerIdToUser.id}`)}
                              className="text-xs h-7 px-2"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Profile
                            </Button>
                            
                            {review.ProductListing && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (review.ProductListing?.id) {
                                    router.push(`/marketplace/${review.ProductListing.id}`);
                                  }
                                }}
                                className="text-xs h-7 px-2"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Listing
                              </Button>
                            )}
                            
                            {/* Only show moderation actions for pending reviews */}
                            {!review.isModerated && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-300 hover:bg-red-50 text-xs h-7 px-2"
                                  onClick={() => handleModeration(review.id, 'reject', 'Inappropriate content')}
                                  disabled={moderating === review.id}
                                >
                                  {moderating === review.id ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <XCircle className="h-3 w-3 mr-1" />
                                  )}
                                  Reject
                                </Button>
                                
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-xs h-7 px-2"
                                  onClick={() => handleModeration(review.id, 'approve')}
                                  disabled={moderating === review.id}
                                >
                                  {moderating === review.id ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                  )}
                                  Approve
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
