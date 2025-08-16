"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Cloud, Users, ShoppingCart, Plus, MessageCircle, Bell, Loader2 } from "lucide-react"
import Link from "next/link"

interface DashboardStats {
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

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      fetchUserRole()
      fetchDashboardData()
    }
  }, [status, router])

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        const data = await response.json()
        const role = (data.user as any)?.role
        setUserRole(role)
        
        // Redirect to role-specific dashboard if available
        if (role === 'admin' || role === 'superadmin') {
          router.replace('/admin')
        } else if (role === 'farmer') {
          router.replace('/dashboard/farmer')
        } else if (role === 'user') {
          router.replace('/dashboard/user')
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch market prices
      const pricesResponse = await fetch('/api/market-prices?limit=4&sortBy=effectiveDate&sortOrder=desc')
      if (pricesResponse.ok) {
        const pricesData = await pricesResponse.json()
        setMarketPrices(pricesData.prices || [])
      }

      // Fetch user stats based on role
      if (userRole === 'farmer') {
        const statsResponse = await fetch('/api/marketplace/my-listings')
        if (statsResponse.ok) {
          const listingsData = await statsResponse.json()
          const totalListings = listingsData.listings?.length || 0
          
          setStats({
            totalListings,
            activeBids: 0, // TODO: Implement bid tracking
            completedSales: 0, // TODO: Implement sales tracking
            totalEarnings: 0, // TODO: Implement earnings tracking
            pendingMessages: 0, // TODO: Implement message tracking
            priceAlerts: 0 // TODO: Implement alert tracking
          })
        }
      } else if (userRole === 'user') {
        // TODO: Implement buyer stats
        setStats({
          totalListings: 0,
          activeBids: 0,
          completedSales: 0,
          totalEarnings: 0,
          pendingMessages: 0,
          priceAlerts: 0
        })
      }
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
          <p className="text-lg text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }
  
  if (status === "unauthenticated") {
    return null
  }

  // If we have a role, redirect to appropriate dashboard
  if (userRole && userRole !== 'admin' && userRole !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-lg text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {session?.user?.name && <span>Welcome back, {session?.user?.name}!</span>}
          </h2>
          <p className="text-lg text-gray-600">Here's what's happening with your account today</p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> You're viewing the general dashboard. For a personalized experience, 
              visit your role-specific dashboard: 
              <Link href="/dashboard/farmer" className="ml-1 underline hover:text-blue-600">Farmer Dashboard</Link> or 
              <Link href="/dashboard/user" className="ml-1 underline hover:text-blue-600">User Dashboard</Link>
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats?.totalListings || 0}</div>
              <p className="text-sm text-gray-600">Real-time data</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Bids</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats?.activeBids || 0}</div>
              <p className="text-sm text-gray-600">Real-time data</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completed Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats?.completedSales || 0}</div>
              <p className="text-sm text-gray-600">Real-time data</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">UGX {(stats?.totalEarnings || 0).toLocaleString()}</div>
              <p className="text-sm text-gray-600">Real-time data</p>
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
                <CardDescription>Common tasks for all users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button className="h-20 flex-col" asChild>
                    <Link href="/marketplace">
                      <ShoppingCart className="h-6 w-6 mb-2" />
                      Browse Products
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
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-4 text-gray-500">
                    <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No recent activity</p>
                    <p className="text-xs">Activity will appear here</p>
                  </div>
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
