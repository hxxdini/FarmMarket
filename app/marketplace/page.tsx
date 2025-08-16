"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MapPin, Calendar, Star, MessageCircle, Plus, Loader2, Filter, X, RefreshCw } from "lucide-react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useMarketplaceUpdates } from "@/hooks/use-marketplace-updates"
import Link from "next/link"

interface MarketplaceListing {
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
  images?: Array<{
    id: string
    url: string
    altText?: string
    isPrimary: boolean
    order: number
  }>
  category: string
  status: string
  createdAt: string
  availableUntil?: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function MarketplacePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [listings, setListings] = useState<MarketplaceListing[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [selectedQuality, setSelectedQuality] = useState("all")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  })
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Use the marketplace updates hook for real-time notifications
  useMarketplaceUpdates()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      fetchListings()
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchListings()
    }
  }, [searchTerm, selectedCategory, selectedLocation, selectedQuality, minPrice, maxPrice, pagination.page])

  // Auto-refresh every 30 seconds to show new listings
  useEffect(() => {
    if (status === "authenticated") {
      const interval = setInterval(() => {
        fetchListings(false) // Silent refresh
      }, 30000) // 30 seconds

      return () => clearInterval(interval)
    }
  }, [status])

  const fetchListings = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      const params = new URLSearchParams({
        search: searchTerm,
        category: selectedCategory,
        location: selectedLocation,
        quality: selectedQuality,
        minPrice,
        maxPrice,
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })

      const response = await fetch(`/api/marketplace/listings?${params}`)
      if (response.ok) {
        const data = await response.json()
        setListings(data.listings)
        setPagination(data.pagination)
      } else {
        if (showLoading) {
          toast.error('Failed to fetch listings')
        }
      }
    } catch (error) {
      console.error('Error fetching listings:', error)
      if (showLoading) {
        toast.error('Failed to fetch listings')
      }
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  const handleManualRefresh = async () => {
    setRefreshing(true)
    await fetchListings()
    setRefreshing(false)
    toast.success('Marketplace refreshed!')
  }

  const resetFilters = () => {
    setSearchTerm("")
    setSelectedCategory("all")
    setSelectedLocation("all")
    setSelectedQuality("all")
    setMinPrice("")
    setMaxPrice("")
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleBuyNow = (listing: MarketplaceListing) => {
    // TODO: Implement buy now functionality
    toast.info(`Buy functionality coming soon for ${listing.title}`)
  }

  const handleContactFarmer = async (listing: MarketplaceListing) => {
    if (!session?.user?.email) {
      toast.error("Please log in to contact the seller")
      router.push("/login")
      return
    }

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

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }
  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Mobile Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Find Fresh Produce</h1>
          <p className="text-sm sm:text-base text-gray-600">Browse products directly from farmers across Uganda</p>
        </div>

        {/* Filters */}
        <Card className="mb-4 sm:mb-6 shadow-sm">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
              <div className="hidden sm:block">
                <CardTitle className="text-lg">Search & Filter</CardTitle>
                <CardDescription>Find exactly what you're looking for</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Button
                  variant="outline"
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  className="flex items-center justify-center space-x-2 h-9 text-sm"
                  size="sm"
                >
                  {refreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center justify-center space-x-2 h-9 text-sm"
                  size="sm"
                >
                  <Filter className="h-4 w-4" />
                  <span>{showAdvancedFilters ? 'Hide' : 'More'} Filters</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 sm:space-y-4">
              {/* Search - Always visible on mobile */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  name="search"
                  placeholder="Search products or farmers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>

              {/* Basic Filters - Mobile: stacked, Desktop: row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category" name="category" className="h-10">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Maize">Maize</SelectItem>
                    <SelectItem value="Beans">Beans</SelectItem>
                    <SelectItem value="Coffee">Coffee</SelectItem>
                    <SelectItem value="Bananas">Bananas</SelectItem>
                    <SelectItem value="Cassava">Cassava</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger id="location" name="location" className="h-10">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="Kampala">Kampala</SelectItem>
                    <SelectItem value="Mbale">Mbale</SelectItem>
                    <SelectItem value="Mukono">Mukono</SelectItem>
                    <SelectItem value="Masaka">Masaka</SelectItem>
                    <SelectItem value="Jinja">Jinja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="space-y-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Select value={selectedQuality} onValueChange={setSelectedQuality}>
                      <SelectTrigger id="quality" name="quality" className="h-10">
                        <SelectValue placeholder="Quality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Qualities</SelectItem>
                        <SelectItem value="Premium">Premium</SelectItem>
                        <SelectItem value="Standard">Standard</SelectItem>
                        <SelectItem value="Basic">Basic</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      id="minPrice"
                      name="minPrice"
                      placeholder="Min Price (UGX)"
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="h-10"
                    />

                    <Input
                      id="maxPrice"
                      name="maxPrice"
                      placeholder="Max Price (UGX)"
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="h-10"
                    />
                  </div>
                  
                  <Button variant="outline" onClick={resetFilters} className="w-full sm:w-auto flex items-center justify-center space-x-2 h-10" size="sm">
                    <X className="h-4 w-4" />
                    <span>Reset All Filters</span>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Showing {listings.length} of {pagination.total} products</span>
            <span className="block sm:inline sm:ml-2 text-xs text-gray-400">Auto-refreshes every 30 seconds</span>
          </div>
          <div className="text-sm text-gray-600 font-medium">
            Page {pagination.page} of {pagination.totalPages}
          </div>
        </div>

        {/* Product Listings */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Loading marketplace listings...</p>
          </div>
        ) : (
          <>


            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {listings.map((listing) => (
                <Card 
                  key={listing.id} 
                  className="hover:shadow-lg transition-shadow overflow-hidden cursor-pointer group border-0 sm:border shadow-sm"
                  onClick={() => router.push(`/marketplace/${listing.id}`)}
                >
                  <div className="relative h-40 sm:h-48">
                    <Image 
                      src={listing.images?.[0]?.url || "/placeholder.svg"} 
                      alt={listing.title} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform" 
                    />
                    <Badge className="absolute top-2 right-2 bg-green-600 text-xs">{listing.status}</Badge>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200" />
                  </div>

                  <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                    <CardTitle className="text-base sm:text-lg group-hover:text-green-600 transition-colors line-clamp-1">{listing.title}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                        <AvatarImage src={listing.farmerAvatar || undefined} alt={listing.farmer} />
                        <AvatarFallback className="text-xs">
                          {listing.farmer
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <Link 
                        href={`/users/${listing.farmerId}`}
                        className="text-xs sm:text-sm text-gray-600 hover:text-green-600 transition-colors truncate flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {listing.farmer}
                      </Link>
                      <div className="flex items-center">
                        {listing.farmerRating > 0 ? (
                          <>
                            <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current" />
                            <span className="text-xs sm:text-sm text-gray-600 ml-1">
                              {listing.farmerRating.toFixed(1)}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">No ratings</span>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-lg sm:text-2xl font-bold text-green-600">UGX {listing.price.toLocaleString()}</p>
                          <p className="text-xs sm:text-sm text-gray-600">per {listing.unit}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs sm:text-sm font-medium text-gray-700">
                            {listing.quantity.toLocaleString()} {listing.unit}
                          </p>
                          <Badge variant="outline" className="text-xs mt-1">{listing.quality}</Badge>
                        </div>
                      </div>

                      <div className="flex items-center text-xs sm:text-sm text-gray-500">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{listing.location}</span>
                      </div>

                      <div className="flex items-center text-xs sm:text-sm text-gray-500">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                        <span className="truncate">Harvested: {new Date(listing.harvestDate).toLocaleDateString()}</span>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{listing.description}</p>

                      <div className="pt-2">
                        <Button 
                          className="w-full h-9 text-sm"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleContactFarmer(listing)
                          }}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Contact Farmer
                        </Button>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-xs text-gray-500 group-hover:text-green-600 transition-colors">
                          Tap to view details
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {listings.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-gray-500 text-lg">No products found</p>
                  <p className="text-gray-400 mt-2">Try adjusting your search criteria</p>
                </CardContent>
              </Card>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 sm:mt-8 flex justify-center">
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 h-9"
                  >
                    Previous
                  </Button>
                  
                  {/* Show limited pages on mobile */}
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else {
                      // Smart pagination for mobile
                      if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="px-3 h-9 min-w-[36px]"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 h-9"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Seller CTA */}
        <Card className="mt-6 sm:mt-8 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200 shadow-sm">
          <CardContent className="p-4 sm:pt-6">
            <div className="text-center">
              <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-2">Sell Your Produce</h3>
              <p className="text-sm sm:text-base text-blue-700 mb-4">Connect directly with buyers and get better prices for your crops</p>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto h-10"
                onClick={() => router.push('/marketplace/create')}
              >
                <Plus className="h-4 w-4 mr-2" />
                List Your Product
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
