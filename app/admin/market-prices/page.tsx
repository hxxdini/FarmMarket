"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Eye,
  Calendar,
  MapPin,
  Package,
  User,
  Shield,
  Loader2
} from "lucide-react"

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
    email: string
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

interface ReviewStats {
  total: number
  pending: number
  approved: number
  rejected: number
  expired: number
}

export default function AdminMarketPricesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [prices, setPrices] = useState<MarketPrice[]>([])
  const [stats, setStats] = useState<ReviewStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    expired: 0
  })
  const [loading, setLoading] = useState(true)
  const [moderating, setModerating] = useState<string | null>(null)
  const [selectedPrices, setSelectedPrices] = useState<string[]>([])
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'expire'>('approve')
  
  const [filters, setFilters] = useState({
    status: 'pending',
    cropType: '',
    location: '',
    search: ''
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
  }, [status, filters, pagination.page, router])

  const fetchPrices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        status: filters.status,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.cropType && { cropType: filters.cropType }),
        ...(filters.location && { location: filters.location })
      })

      const response = await fetch(`/api/admin/market-prices?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setPrices(data.prices)
        setStats(data.stats)
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages
        }))
      } else {
        const error = await response.json()
        console.error('Failed to fetch admin prices:', error)
        toast.error('Failed to fetch market prices')
      }
    } catch (error) {
      console.error('Error fetching admin prices:', error)
      toast.error('Failed to fetch market prices')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
    setSelectedPrices([])
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleBulkAction = async (action: 'approve' | 'reject' | 'expire') => {
    if (selectedPrices.length === 0) {
      toast.error('Please select prices to moderate')
      return
    }

    try {
      setModerating('bulk')
      
      const response = await fetch('/api/admin/market-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          priceIds: selectedPrices,
          reviewNotes: reviewNotes || undefined
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message)
        
        // Reset selection and refresh
        setSelectedPrices([])
        setReviewNotes('')
        setReviewDialogOpen(false)
        fetchPrices()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to moderate prices')
      }
    } catch (error) {
      console.error('Bulk action error:', error)
      toast.error('Failed to moderate prices')
    } finally {
      setModerating(null)
    }
  }

  const handleIndividualAction = async (priceId: string, action: 'approve' | 'reject' | 'expire') => {
    try {
      setModerating(priceId)
      
      const response = await fetch('/api/admin/market-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          priceIds: [priceId],
          reviewNotes: reviewNotes || undefined
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message)
        fetchPrices()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to moderate price')
      }
    } catch (error) {
      console.error('Individual action error:', error)
      toast.error('Failed to moderate price')
    } finally {
      setModerating(null)
    }
  }

  const togglePriceSelection = (priceId: string) => {
    setSelectedPrices(prev => 
      prev.includes(priceId) 
        ? prev.filter(id => id !== priceId)
        : [...prev, priceId]
    )
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
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Market Price Review</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Review and moderate submitted market prices to ensure accuracy and quality
          </p>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 sm:mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-gray-600">{stats.expired}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger id="status" name="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
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
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  name="search"
                  placeholder="Search prices..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedPrices.length > 0 && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">
                  {selectedPrices.length} price{selectedPrices.length > 1 ? 's' : ''} selected
                </span>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setReviewAction('approve')
                    setReviewDialogOpen(true)
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Selected
                </Button>
                
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setReviewAction('reject')
                    setReviewDialogOpen(true)
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Selected
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReviewAction('expire')
                    setReviewDialogOpen(true)
                  }}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Expire Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            <p className="text-gray-500">
              {filters.status === 'pending' ? 'No prices are pending review.' :
               filters.status === 'approved' ? 'No prices have been approved yet.' :
               filters.status === 'rejected' ? 'No prices have been rejected yet.' :
               filters.status === 'expired' ? 'No prices have expired yet.' :
               'No prices match the current filters.'}
            </p>
          </Card>
        ) : (
          <>
            {/* Prices Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {prices.map((price) => (
                <Card 
                  key={price.id} 
                  className={`hover:shadow-lg transition-shadow ${
                    selectedPrices.includes(price.id) ? 'ring-2 ring-green-500' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <input
                            type="checkbox"
                            checked={selectedPrices.includes(price.id)}
                            onChange={() => togglePriceSelection(price.id)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <CardTitle className="text-lg">{price.cropType}</CardTitle>
                        </div>
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
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {price.submittedBy.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {price.submittedBy.email}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {price.submittedBy.location}
                        </p>
                      </div>
                    </div>

                    {/* Review Status */}
                    {price.status === 'PENDING' && (
                      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="text-sm text-yellow-800 mb-2">
                          <strong>Pending Review</strong> - Submitted {formatDate(price.createdAt)}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleIndividualAction(price.id, 'approve')}
                            disabled={moderating === price.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {moderating === price.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Approve
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleIndividualAction(price.id, 'reject')}
                            disabled={moderating === price.id}
                          >
                            {moderating === price.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-2" />
                            )}
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Review Info */}
                    {price.reviewedBy && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-700">
                          <strong>Reviewed by:</strong> {price.reviewedBy.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDate(price.reviewDate!)}
                        </div>
                        {price.reviewNotes && (
                          <div className="text-sm text-gray-600 mt-1">
                            <strong>Notes:</strong> {price.reviewNotes}
                          </div>
                        )}
                      </div>
                    )}

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

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve' : 
               reviewAction === 'reject' ? 'Reject' : 'Expire'} Selected Prices
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve' ? 'Approve the selected prices for public viewing.' :
               reviewAction === 'reject' ? 'Reject the selected prices with a reason.' :
               'Mark the selected prices as expired.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
              <Textarea
                id="reviewNotes"
                name="reviewNotes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={`Add notes about why you're ${reviewAction}ing these prices...`}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setReviewDialogOpen(false)}
              >
                Cancel
              </Button>
              
              <Button
                onClick={() => handleBulkAction(reviewAction)}
                disabled={moderating === 'bulk'}
                className={
                  reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                  reviewAction === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-gray-600 hover:bg-gray-700'
                }
              >
                {moderating === 'bulk' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : reviewAction === 'approve' ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : reviewAction === 'reject' ? (
                  <XCircle className="h-4 w-4 mr-2" />
                ) : (
                  <Clock className="h-4 w-4 mr-2" />
                )}
                {reviewAction === 'approve' ? 'Approve' : 
                 reviewAction === 'reject' ? 'Reject' : 'Expire'} {selectedPrices.length} Price{selectedPrices.length > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
