"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Eye, Loader2, Database } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"

interface ProductListing {
  id: string
  cropType: string
  quantity: number
  unit: string
  pricePerUnit: number
  quality: string
  status: string
  createdAt: string
  location: string
  description?: string
  harvestDate?: string
  availableUntil?: string
  images?: { id: string; url: string; altText?: string }[]
}

export default function MyListingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [listings, setListings] = useState<ProductListing[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      fetchListings()
    }
  }, [status, router])

  const fetchListings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/marketplace/my-listings')
      if (response.ok) {
        const data = await response.json()
        setListings(data.listings)
      } else {
        toast.error('Failed to fetch listings')
      }
    } catch (error) {
      console.error('Error fetching listings:', error)
      toast.error('Failed to fetch listings')
    } finally {
      setLoading(false)
    }
  }

  const handleSeedData = async () => {
    try {
      setSeeding(true)
      const response = await fetch('/api/marketplace/seed', {
        method: 'POST'
      })
      
      if (response.ok) {
        toast.success('Sample data added successfully!')
        fetchListings() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to seed data')
      }
    } catch (error) {
      console.error('Error seeding data:', error)
      toast.error('Failed to seed data')
    } finally {
      setSeeding(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) {
      return
    }

    try {
      setDeletingId(id)
      const response = await fetch(`/api/marketplace/listings/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Listing deleted successfully')
        setListings(listings.filter(listing => listing.id !== id))
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete listing')
      }
    } catch (error) {
      console.error('Error deleting listing:', error)
      toast.error('Failed to delete listing')
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'sold':
        return 'default'
      case 'expired':
        return 'destructive'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
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
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }
  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">My Listings</h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600">Manage your product listings</p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Button variant="outline" onClick={handleSeedData} disabled={seeding} size="sm" className="h-9">
                {seeding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Adding Sample Data...</span>
                    <span className="sm:hidden">Adding...</span>
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Add Sample Data</span>
                    <span className="sm:hidden">Sample Data</span>
                  </>
                )}
              </Button>
              <Button asChild size="sm" className="h-9">
                <Link href="/marketplace/create">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Create New Listing</span>
                  <span className="sm:hidden">New Listing</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <Card className="shadow-sm">
            <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total Listings</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-lg sm:text-2xl font-bold text-gray-900">{listings.length}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Active</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-lg sm:text-2xl font-bold text-green-600">
                {listings.filter(l => l.status.toLowerCase() === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Pending</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                {listings.filter(l => l.status.toLowerCase() === 'pending').length}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm col-span-2 sm:col-span-1">
            <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total Value</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-base sm:text-2xl font-bold text-blue-600">
                UGX {listings.reduce((sum, l) => sum + (l.quantity * l.pricePerUnit), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Listings */}
        <Card>
          <CardHeader>
            <CardTitle>Product Listings</CardTitle>
            <CardDescription>Your current product listings in the marketplace</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Loading your listings...</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">You haven't created any listings yet.</p>
                <div className="space-y-3">
                  <Button asChild>
                    <Link href="/marketplace/create">Create Your First Listing</Link>
                  </Button>
                  <div className="text-sm text-gray-400">or</div>
                  <Button variant="outline" onClick={handleSeedData} disabled={seeding}>
                    {seeding ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding Sample Data...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        Add Sample Data
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {listings.map((listing) => (
                  <Card key={listing.id} className="border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
                    <CardContent className="p-2 sm:p-3">
                      <div className="flex items-center justify-between">
                        {/* Left side - Image and main info */}
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                          {/* Product Image Thumbnail */}
                          
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{listing.cropType}</h3>
                              <Badge 
                                variant={getStatusColor(listing.status)}
                                className="capitalize text-xs"
                              >
                                {listing.status}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm">
                              <div>
                                <span className="text-gray-500">Qty:</span>
                                <span className="font-medium text-gray-900 ml-1">{listing.quantity.toLocaleString()} {listing.unit}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Price:</span>
                                <span className="font-medium text-green-600 ml-1">UGX {listing.pricePerUnit.toLocaleString()}</span>
                              </div>
                              
                              <div className="hidden sm:block">
                                <span className="text-gray-500">Listed:</span>
                                <span className="font-medium text-gray-900 ml-1">{formatDate(listing.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right side - Actions */}
                        <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
                          <Button variant="outline" size="sm" asChild className="h-8 px-2 sm:px-3">
                            <Link href={`/marketplace/${listing.id}`}>
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                              <span className="hidden sm:inline">View</span>
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild className="h-8 px-2 sm:px-3">
                            <Link href={`/marketplace/edit/${listing.id}`}>
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Edit</span>
                            </Link>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(listing.id)}
                            disabled={deletingId === listing.id}
                            className="h-8 px-2 sm:px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {deletingId === listing.id ? (
                              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
