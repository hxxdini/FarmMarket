"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Star, 
  MessageCircle, 
  Phone,
  Mail,
  ShoppingCart,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  X,
  User
} from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { ReviewsList } from "@/components/ui/reviews-list"
import { UserRatingSummary } from "@/components/ui/user-rating-summary"
import ReviewModal from "@/components/ui/review-modal"
import Link from "next/link"

interface ProductImage {
  id: string
  url: string
  altText?: string
  isPrimary: boolean
  order: number
}

interface ListingDetail {
  id: string
  title: string
  farmer: string
  farmerId: string
  farmerAvatar?: string
  farmerRating: number
  location: string
  price: number
  unit: string
  quantity: number
  quality: string
  harvestDate: string
  description: string
  image: string
  images: ProductImage[]
  category: string
  status: string
  createdAt: string
  availableUntil?: string
}

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)

  const listingId = params.id as string

  useEffect(() => {
    if (listingId) {
      fetchListingDetail()
    }
  }, [listingId])

  const fetchListingDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/marketplace/listings/${listingId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch listing details')
      }

      const data = await response.json()
      setListing(data.listing)
    } catch (error) {
      console.error('Error fetching listing:', error)
      toast.error('Failed to load listing details')
    } finally {
      setLoading(false)
    }
  }

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index)
    setShowImageModal(true)
  }

  const nextImage = () => {
    if (listing?.images) {
      setSelectedImageIndex((prev) => 
        prev === listing.images.length - 1 ? 0 : prev + 1
      )
    }
  }

  const previousImage = () => {
    if (listing?.images) {
      setSelectedImageIndex((prev) => 
        prev === 0 ? listing.images.length - 1 : prev - 1
      )
    }
  }

  const handleContactFarmer = async () => {
    if (!session) {
      toast.error('Please log in to contact the farmer')
      router.push('/login')
      return
    }

    if (!listing) return

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otherUserId: listing.farmerId,
          listingId: listing.id,
          initialMessage: `Hi! I'm interested in your ${listing.title}. Is it still available?`
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Conversation started!")
        router.push(`/messages/${data.conversation.id}`)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to start conversation")
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      toast.error("Failed to start conversation")
    }
  }

  const handleBuyNow = () => {
    if (!session) {
      toast.error('Please log in to purchase')
      router.push('/login')
      return
    }
    // TODO: Implement purchase flow
    toast.info('Purchase system coming soon!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading listing details...</p>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Listing Not Found</h1>
          <p className="text-gray-600 mb-6">The listing you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push('/marketplace')}>
            Back to Marketplace
          </Button>
        </div>
      </div>
    )
  }

  const primaryImage = listing.images?.find(img => img.isPrimary) || listing.images?.[0] || { url: listing.image }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center space-x-1 sm:space-x-2 p-2 sm:p-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-medium text-gray-900 truncate">{listing.title}</h1>
              <p className="text-xs sm:text-sm text-gray-500 truncate">by {listing.farmer}</p>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button variant="ghost" size="sm" className="p-2 sm:p-2">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Save</span>
              </Button>
              <Button variant="ghost" size="sm" className="p-2 sm:p-2">
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Share</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Image Gallery */}
          <div className="space-y-3 sm:space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-white shadow-sm">
              <Image
                src={primaryImage.url || '/placeholder.svg'}
                alt={listing.title}
                fill
                className="object-cover cursor-pointer hover:scale-105 transition-transform"
                onClick={() => handleImageClick(0)}
              />
              <Badge className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-green-600 text-xs sm:text-sm">
                {listing.status}
              </Badge>
            </div>

            {/* Thumbnail Gallery */}
            {listing.images && listing.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {listing.images.map((image, index) => (
                  <div
                    key={image.id}
                    className="relative aspect-square rounded-lg overflow-hidden bg-white cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                    onClick={() => handleImageClick(index)}
                  >
                    <Image
                      src={image.url}
                      alt={image.altText || `${listing.title} image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    {image.isPrimary && (
                      <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1 rounded">
                        Main
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="space-y-3 sm:space-y-4 lg:space-y-3">
            {/* Title and Price */}
            <div className="bg-gradient-to-r from-green-50 via-white to-blue-50 p-3 sm:p-4 lg:p-4 rounded-lg sm:rounded-xl border-2 border-green-100 shadow-sm">
              <h1 className="text-xl sm:text-2xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">{listing.title}</h1>
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:space-x-3 space-y-1 sm:space-y-0 mb-3">
                <p className="text-2xl sm:text-3xl lg:text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                  UGX {listing.price.toLocaleString()}
                </p>
                <p className="text-sm sm:text-base lg:text-base text-gray-600 font-medium">per {listing.unit}</p>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm">
                <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200">
                  <ShoppingCart className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                  <span className="font-medium text-gray-700">{listing.quantity.toLocaleString()} {listing.unit} available</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200">
                  <Calendar className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                  <span className="font-medium text-gray-700">Harvested {new Date(listing.harvestDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Seller Information & Product Details - Side by side on desktop */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              {/* Seller Information */}
              <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 sm:pb-3 lg:pb-2">
                  <CardTitle className="text-sm sm:text-base lg:text-sm flex items-center space-x-2">
                    <User className="h-4 w-4 text-green-600" />
                    <span>Seller Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 sm:space-y-3 lg:space-y-2.5">
                  <div className="flex items-center space-x-2.5 sm:space-x-3">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 lg:h-10 lg:w-10 border-2 border-gray-100 flex-shrink-0">
                      <AvatarImage src={listing.farmerAvatar || undefined} alt={listing.farmer} />
                      <AvatarFallback className="text-xs sm:text-sm font-semibold">
                        {listing.farmer.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/users/${listing.farmerId}`}
                        className="text-sm sm:text-base lg:text-sm font-semibold text-gray-900 hover:text-green-600 transition-colors block truncate"
                      >
                        {listing.farmer}
                      </Link>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        {listing.farmerRating > 0 ? (
                          <>
                            <div className="flex items-center space-x-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`h-3 w-3 ${
                                    star <= listing.farmerRating 
                                      ? 'text-yellow-400 fill-current' 
                                      : 'text-gray-300'
                                  }`} 
                                />
                              ))}
                            </div>
                            <span className="text-xs font-medium text-gray-700">
                              {listing.farmerRating.toFixed(1)}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">No ratings yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1.5 text-xs sm:text-sm text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                    <MapPin className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                    <span className="font-medium truncate">{listing.location}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-1.5 sm:space-y-0 sm:space-x-1.5">
                    <Link href={`/users/${listing.farmerId}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                        <User className="h-3.5 w-3.5 mr-1.5" />
                        View Profile
                      </Button>
                    </Link>
                    
                    {session?.user?.email && session.user.email !== listing.farmer && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowReviewModal(true)}
                        className="flex-1 h-8 text-xs"
                      >
                        <Star className="h-3.5 w-3.5 mr-1.5" />
                        Review
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Product Details */}
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-2 sm:pb-3 lg:pb-2">
                  <CardTitle className="text-sm sm:text-base lg:text-sm flex items-center space-x-2">
                    <ShoppingCart className="h-4 w-4 text-green-600" />
                    <span>Product Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 sm:space-y-3 lg:space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                    <div className="bg-gray-50 p-2.5 sm:p-3 lg:p-2.5 rounded-lg">
                      <p className="text-xs text-gray-500 mb-0.5">Quantity Available</p>
                      <p className="text-sm sm:text-base lg:text-sm font-semibold text-gray-900">{listing.quantity.toLocaleString()} {listing.unit}</p>
                    </div>
                    <div className="bg-gray-50 p-2.5 sm:p-3 lg:p-2.5 rounded-lg">
                      <p className="text-xs text-gray-500 mb-0.5">Quality Grade</p>
                      <Badge variant="outline" className="text-xs px-2 py-0.5">{listing.quality}</Badge>
                    </div>
                    <div className="bg-gray-50 p-2.5 sm:p-3 lg:p-2.5 rounded-lg">
                      <p className="text-xs text-gray-500 mb-0.5">Harvest Date</p>
                      <p className="text-sm sm:text-base lg:text-sm font-semibold text-gray-900">
                        {new Date(listing.harvestDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-2.5 sm:p-3 lg:p-2.5 rounded-lg">
                      <p className="text-xs text-gray-500 mb-0.5">Available Until</p>
                      <p className="text-sm sm:text-base lg:text-sm font-semibold text-gray-900">
                        {listing.availableUntil ? new Date(listing.availableUntil).toLocaleDateString() : 'Not specified'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Product Description - Compact version */}
            {listing.description && (
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-2 sm:pb-3 lg:pb-2">
                  <CardTitle className="text-sm sm:text-base lg:text-sm flex items-center space-x-2">
                    <ShoppingCart className="h-4 w-4 text-green-600" />
                    <span>Description</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-3 sm:p-4 lg:p-3 rounded-lg">
                    <p className="text-gray-700 leading-relaxed text-xs sm:text-sm lg:text-xs">{listing.description}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 sm:space-y-3 mt-3 lg:mt-3">
              <Button 
                onClick={handleContactFarmer}
                className="w-full h-10 sm:h-12 lg:h-10 text-sm sm:text-base lg:text-sm bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                size="lg"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Farmer
              </Button>
              
              <div className="text-center px-1">
                <p className="text-xs text-gray-500 leading-relaxed">
                  💡 Contact the farmer to discuss pricing & delivery
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews and Rating Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Farmer Rating Summary */}
          <div className="lg:col-span-1">
            <UserRatingSummary userId={listing.farmerId} />
          </div>
          
          {/* Reviews List */}
          <div className="lg:col-span-2">
            <ReviewsList
              userId={listing.farmerId}
              mode="received"
              title={`Reviews for ${listing.farmer}`}
              description={`All customer reviews and ratings for ${listing.farmer}`}
            />
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && listing.images && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Navigation Buttons */}
            {listing.images.length > 1 && (
              <>
                <button
                  onClick={previousImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Main Image */}
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={listing.images[selectedImageIndex].url}
                alt={listing.images[selectedImageIndex].altText || `${listing.title} image ${selectedImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Image Counter */}
            {listing.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-3 py-1 rounded-full">
                {selectedImageIndex + 1} of {listing.images.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        reviewedUserId={listing?.farmerId || ''}
        reviewedUserName={listing?.farmer || ''}
        listingId={listing?.id || ''}
        listingTitle={listing?.title || ''}
        onReviewSubmitted={() => {
          toast.success('Review submitted successfully and is pending admin approval!')
          // Note: Review won't appear until approved by admin
        }}
      />
    </div>
  )
}
