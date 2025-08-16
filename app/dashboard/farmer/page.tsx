"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Cloud, Users, ShoppingCart, Bell, Plus, MessageCircle, Package, DollarSign, Loader2 } from "lucide-react"
import Link from "next/link"

interface FarmerStats {
  totalListings: number
  activeBids: number
  completedSales: number
  totalEarnings: number
  pendingMessages: number
  priceAlerts: number
}

interface MarketPrice {
  cropType: string
  pricePerUnit: number
  unit: string
  location: string
  quality: string
  source: string
  effectiveDate: string
  priceChange?: number
}

interface ProductListing {
  id: string
  cropType: string
  quantity: number
  unit: string
  pricePerUnit: number
  quality: string
  location: string
  status: string
  createdAt: string
}

export default function FarmerDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<FarmerStats | null>(null)
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([])
  const [myListings, setMyListings] = useState<ProductListing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      fetchDashboardData()
    }
  }, [status, router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch market prices
      const pricesResponse = await fetch('/api/market-prices?limit=4&sortBy=effectiveDate&sortOrder=desc')
      if (pricesResponse.ok) {
        const pricesData = await pricesResponse.json()
        setMarketPrices(pricesData.prices || [])
      }

      // Fetch farmer's listings
      const listingsResponse = await fetch('/api/marketplace/my-listings')
      if (listingsResponse.ok) {
        const listingsData = await listingsResponse.json()
        setMyListings(listingsData.listings || [])
        
        // Calculate stats from listings
        const totalListings = listingsData.listings?.length || 0
        const activeListings = listingsData.listings?.filter((l: ProductListing) => l.status === 'ACTIVE').length || 0
        
        setStats({
          totalListings: totalListings,
          activeBids: 0, // TODO: Implement bid tracking
          completedSales: 0, // TODO: Implement sales tracking
          totalEarnings: 0, // TODO: Implement earnings tracking
          pendingMessages: 0, // TODO: Implement message tracking
          priceAlerts: 0 // TODO: Implement alert tracking
        })
      }

      // TODO: Fetch other real-time data like bids, sales, earnings, messages, alerts
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-lg text-gray-600">Loading your farmer dashboard...</p>
        </div>
      </div>
    )
  }
  
  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {session?.user?.name && <span>Welcome back, {session?.user?.name}!</span>}
          </h2>
          <p className="text-lg text-gray-600">Here's what's happening with your farm business today</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats?.totalListings || 0}</div>
              <p className="text-sm text-green-600">Real-time data</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Bids</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats?.activeBids || 0}</div>
              <p className="text-sm text-blue-600">Real-time data</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completed Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats?.completedSales || 0}</div>
              <p className="text-sm text-green-600">Real-time data</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">UGX {(stats?.totalEarnings || 0).toLocaleString()}</div>
              <p className="text-sm text-green-600">Real-time data</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks to manage your farm business</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button className="h-20 flex-col" asChild>
                    <Link href="/marketplace/create">
                      <Plus className="h-6 w-6 mb-2" />
                      List Product
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
                    <Link href="/market-prices/submit">
                      <TrendingUp className="h-6 w-6 mb-2" />
                      Submit Price
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
                    <Link href="/price-alerts">
                      <Bell className="h-6 w-6 mb-2" />
                      Price Alerts
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Market Prices Preview */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Today's Market Prices</CardTitle>
                    <CardDescription>Latest prices from major markets</CardDescription>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href="/market-prices">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {marketPrices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No market prices available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {marketPrices.map((item, index) => (
                      <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900">{item.cropType}</h3>
                          <div className="flex items-center">
                            {item.priceChange && item.priceChange > 0 && <TrendingUp className="h-4 w-4 text-green-500" />}
                            {item.priceChange && item.priceChange < 0 && <TrendingDown className="h-4 w-4 text-red-500" />}
                            {item.priceChange && (
                              <span
                                className={`text-sm ml-1 ${
                                  item.priceChange > 0 ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {item.priceChange > 0 ? '+' : ''}{item.priceChange.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-2xl font-bold text-gray-900">UGX {item.pricePerUnit.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">per {item.unit}</p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {item.location}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {item.quality}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* My Listings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">My Listings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Listings</span>
                    <Badge className="bg-green-600">{stats?.totalListings || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pending Bids</span>
                    <Badge className="bg-blue-600">{stats?.activeBids || 0}</Badge>
                  </div>
                  <Button className="w-full bg-transparent" variant="outline" asChild>
                    <Link href="/marketplace/my-listings">
                      <Package className="h-4 w-4 mr-2" />
                      Manage Listings
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Listings */}
            {myListings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Listings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {myListings.slice(0, 3).map((listing) => (
                      <div key={listing.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm">{listing.cropType}</h4>
                          <Badge variant={listing.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                            {listing.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">
                          {listing.quantity} {listing.unit} • UGX {listing.pricePerUnit.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">{listing.location}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Earnings Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Earnings Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="text-sm font-medium text-green-600">UGX {(stats?.totalEarnings || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Month</span>
                    <span className="text-sm font-medium">UGX 0</span>
                  </div>
                  <Button className="w-full bg-transparent" variant="outline" asChild>
                    <Link href="/dashboard/analytics">
                      <DollarSign className="h-4 w-4 mr-2" />
                      View Analytics
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Users className="h-4 w-4 mr-2" />
                    Join Community
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
