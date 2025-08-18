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
import { Plus, Search, TrendingUp, TrendingDown, Minus, Calendar, MapPin, Package, List, Grid3X3 } from "lucide-react"
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
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list')
  
  const [filters, setFilters] = useState({
    search: '',
    cropType: '',
    location: '',
    quality: 'all',
    source: 'all',
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
  }, [status, router, pagination.page])

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (status === "authenticated") {
        setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
        fetchPrices()
      }
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [filters.search, filters.cropType, filters.location, filters.quality, filters.source, filters.sortBy, filters.sortOrder])

  // Remove the filters dependency from the main useEffect to avoid double fetching
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [status, router])

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
        ...(filters.source !== 'all' && { source: filters.source })
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
      case 'PREMIUM': return 'bg-green-200 text-green-800 border-green-200'
      case 'STANDARD': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'ECONOMY': return 'bg-green-100 text-green-800 border-green-200'
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
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
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
            <Button onClick={() => router.push('/market-prices/submit')} className="flex items-center w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Submit Price
            </Button>
          )}
        </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Total Prices</p>
                  <p className="text-lg sm:text-2xl font-bold">{pagination.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Active Prices</p>
                  <p className="text-lg sm:text-2xl font-bold">
                    {prices.filter(p => p.status === 'APPROVED').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Regions</p>
                  <p className="text-lg sm:text-2xl font-bold">
                    {new Set(prices.map(p => p.location)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Updated Today</p>
                  <p className="text-lg sm:text-2xl font-bold">
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
        <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
          <CardTitle className="text-base sm:text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <Label htmlFor="search" className="text-sm">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  name="search"
                  placeholder="Search crops, locations, sources..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 h-9 sm:h-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="cropType" className="text-sm">Crop Type</Label>
              <Input
                id="cropType"
                name="cropType"
                placeholder="e.g., Maize"
                value={filters.cropType}
                onChange={(e) => handleFilterChange('cropType', e.target.value)}
                className="h-9 sm:h-10"
              />
            </div>
            
            <div>
              <Label htmlFor="location" className="text-sm">Location</Label>
              <Input
                id="location"
                name="location"
                placeholder="e.g., Kampala"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="h-9 sm:h-10"
              />
            </div>
            
            <div>
              <Label htmlFor="quality" className="text-sm">Quality</Label>
              <Select value={filters.quality} onValueChange={(value) => handleFilterChange('quality', value)}>
                <SelectTrigger id="quality" name="quality" className="h-9 sm:h-10">
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
              <Label htmlFor="sortBy" className="text-sm">Sort By</Label>
              <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                <SelectTrigger id="sortBy" name="sortBy" className="h-9 sm:h-10">
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
            {/* View Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">View:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 px-2 sm:px-3 text-xs sm:text-sm"
                  >
                    <List className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    List
                  </Button>
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                    className="h-8 px-2 sm:px-3 text-xs sm:text-sm"
                  >
                    <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Cards
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-gray-500 text-center sm:text-left">
                {prices.length} of {pagination.total} prices
              </div>
            </div>

            {/* List View */}
            {viewMode === 'list' && (
              <Card className="border-0 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Crop & Quality
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Effective Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted By
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {prices.map((price) => (
                        <tr key={price.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{price.cropType}</div>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge className={getQualityColor(price.quality)}>
                                  {price.quality}
                                </Badge>
                                {price.marketTrend && getTrendIcon(price.marketTrend)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-600">
                                UGX {price.pricePerUnit.toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-500">per {price.unit}</div>
                              {price.regionalAverage && (
                                <div className="text-xs text-blue-600 mt-1">
                                  Avg: UGX {price.regionalAverage.toFixed(2)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-900">{price.location}</span>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(price.effectiveDate)}</div>
                            {price.expiryDate && (
                              <div className="text-xs text-gray-500">
                                Expires: {formatDate(price.expiryDate)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Cards View */}
            {viewMode === 'cards' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {prices.map((price) => (
                  <Card key={price.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2 pt-3 px-3 sm:px-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm sm:text-base mb-1 truncate">{price.cropType}</CardTitle>
                          <div className="flex items-center space-x-1 mb-1 flex-wrap gap-1">
                            <Badge className={`text-xs ${getQualityColor(price.quality)}`}>
                              {price.quality}
                            </Badge>
                            
                          </div>
                        </div>
                        
                        {price.marketTrend && (
                          <div className="flex items-center space-x-1 ml-2">
                            {getTrendIcon(price.marketTrend)}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3 px-3 sm:px-4 pb-3">
                      {/* Price Information */}
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-green-600">
                          UGX {price.pricePerUnit.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">per {price.unit}</div>
                      </div>

                      {/* Location and Source - Compact */}
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{price.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate">Effective: {formatDate(price.effectiveDate)}</span>
                        </div>
                      </div>

                      {/* Regional Comparison - Compact */}
                      {price.regionalAverage && (
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <div className="text-xs text-blue-900 mb-1">Regional Avg</div>
                          <div className="text-sm font-semibold text-blue-700">
                            UGX {price.regionalAverage.toFixed(2)} {price.unit}
                          </div>
                          {price.priceChange && (
                            <div className="text-xs text-blue-600">
                              {price.priceChange > 0 ? '+' : ''}{price.priceChange.toFixed(1)}%
                            </div>
                          )}
                        </div>
                      )}

                      {/* Submitted By - Compact */}
                      <div className="flex items-center space-x-2 pt-2 border-t">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {price.submittedBy.name?.split(' ').map(n => n.charAt(0)).join('').substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {price.submittedBy.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {price.submittedBy.location}
                          </p>
                        </div>
                        
                        {price.isVerified && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                            ✓
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-2 mt-6 sm:mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="w-full sm:w-auto"
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1 flex-wrap justify-center">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="w-8 sm:w-10 h-8 sm:h-10 text-xs sm:text-sm"
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
                  className="w-full sm:w-auto"
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
