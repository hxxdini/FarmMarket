"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Plus, Search, Filter, TrendingUp, TrendingDown, Minus, Eye, Calendar, MapPin, Package } from "lucide-react"
import { useRouter } from "next/navigation"

interface MarketPrice {
  id: string
  cropType: string
  pricePerUnit: number
  unit: string
  quality: 'PREMIUM' | 'STANDARD' | 'ECONOMY'
  location: string
  source: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  submittedBy: {
    id: string
    name: string
    location: string
  }
  reviewedBy?: {
    id: string
    name: string
  }
  reviewNotes?: string
  reviewDate?: string
  effectiveDate: string
  expiryDate?: string
  isVerified: boolean
  verificationScore: number
  marketTrend?: 'UP' | 'DOWN' | 'STABLE'
  regionalAverage?: number
  priceChange?: number
  createdAt: string
  updatedAt: string
}

interface RegionalAverage {
  cropType: string
  location: string
  quality: string
  averagePrice: number
  sampleCount: number
}

export default function MarketPricesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [prices, setPrices] = useState<MarketPrice[]>([])
  const [regionalAverages, setRegionalAverages] = useState<RegionalAverage[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [filters, setFilters] = useState({
    search: '',
    cropType: '',
    location: '',
    quality: 'all',
    source: 'all',
    status: 'all',
    sortBy: 'effectiveDate',
    sortOrder: 'desc'
  })

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      fetchPrices()
    }
  }, [status, router, filters, pagination.page])

  const fetchPrices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.search && { search: filters.search }),
        ...(filters.cropType && { cropType: filters.cropType }),
        ...(filters.location && { location: filters.location }),
        ...(filters.quality !== 'all' && { quality: filters.quality }),
        ...(filters.source !== 'all' && { source: filters.source }),
        ...(filters.status !== 'all' && { status: filters.status })
      })

      const response = await fetch(`/api/market-prices?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setPrices(data.prices)
        setRegionalAverages(data.regionalAverages)
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages
        }))
      } else {
        const error = await response.json()
        console.error('Failed to fetch prices:', error)
        toast.error('Failed to fetch market prices')
      }
    } catch (error) {
      console.error('Error fetching prices:', error)
      toast.error('Failed to fetch market prices')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'PREMIUM': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'STANDARD': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'ECONOMY': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200'
      case 'EXPIRED': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'UP': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'DOWN': return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'STABLE': return <Minus className="h-4 w-4 text-gray-600" />
      default: return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Market Prices</h1>
              <p className="text-sm sm:text-base text-gray-600">
                Real-time market prices for agricultural products across different regions
              </p>
            </div>
          
          {session && (
            <Button onClick={() => router.push('/market-prices/submit')} className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Submit Price
            </Button>
          )}
        </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 sm:mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Prices</p>
                  <p className="text-2xl font-bold">{pagination.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Active Prices</p>
                  <p className="text-2xl font-bold">
                    {prices.filter(p => p.status === 'APPROVED').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Regions</p>
                  <p className="text-2xl font-bold">
                    {new Set(prices.map(p => p.location)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Updated Today</p>
                  <p className="text-2xl font-bold">
                    {prices.filter(p => {
                      const today = new Date().toDateString()
                      const priceDate = new Date(p.updatedAt).toDateString()
                      return today === priceDate
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm mb-4 sm:mb-6">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  name="search"
                  placeholder="Crop, location..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="cropType">Crop Type</Label>
              <Input
                id="cropType"
                name="cropType"
                placeholder="e.g., Maize"
                value={filters.cropType}
                onChange={(e) => handleFilterChange('cropType', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                placeholder="e.g., Kampala"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="quality">Quality</Label>
              <Select value={filters.quality} onValueChange={(value) => handleFilterChange('quality', value)}>
                <SelectTrigger id="quality" name="quality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Qualities</SelectItem>
                  <SelectItem value="PREMIUM">Premium</SelectItem>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="ECONOMY">Economy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger id="status" name="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="sortBy">Sort By</Label>
              <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                <SelectTrigger id="sortBy" name="sortBy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="effectiveDate">Effective Date</SelectItem>
                  <SelectItem value="pricePerUnit">Price</SelectItem>
                  <SelectItem value="createdAt">Submission Date</SelectItem>
                  <SelectItem value="verificationScore">Verification Score</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Prices List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading market prices...</p>
          </div>
        ) : prices.length === 0 ? (
          <Card className="text-center py-12">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No market prices found</h3>
            <p className="text-gray-500 mb-4">No prices match the current filters.</p>
            {session && (
              <Button onClick={() => router.push('/market-prices/submit')}>
                <Plus className="h-4 w-4 mr-2" />
                Submit First Price
              </Button>
            )}
          </Card>
        ) : (
          <>
            {/* Prices Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {prices.map((price) => (
                <Card key={price.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{price.cropType}</CardTitle>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getQualityColor(price.quality)}>
                            {price.quality}
                          </Badge>
                          <Badge className={getStatusColor(price.status)}>
                            {price.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {price.marketTrend && (
                        <div className="flex items-center space-x-1">
                          {getTrendIcon(price.marketTrend)}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Price Information */}
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {price.pricePerUnit.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">per {price.unit}</div>
                    </div>

                    {/* Location and Source */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{price.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>Effective: {formatDate(price.effectiveDate)}</span>
                      </div>
                    </div>

                    {/* Regional Comparison */}
                    {price.regionalAverage && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm text-blue-900 mb-1">Regional Average</div>
                        <div className="text-lg font-semibold text-blue-700">
                          {price.regionalAverage.toFixed(2)} {price.unit}
                        </div>
                        {price.priceChange && (
                          <div className="text-sm text-blue-600">
                            {price.priceChange > 0 ? '+' : ''}{price.priceChange.toFixed(1)}% from previous
                          </div>
                        )}
                      </div>
                    )}

                    {/* Submitted By */}
                    <div className="flex items-center space-x-3 pt-2 border-t">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {price.submittedBy.name?.split(' ').map(n => n.charAt(0)).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {price.submittedBy.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {price.submittedBy.location}
                        </p>
                      </div>
                      
                      {price.isVerified && (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          ✓ Verified
                        </Badge>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/market-prices/${price.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="w-10"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      </main>
    </div>
  )
}
