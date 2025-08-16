"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  ShoppingCart, 
  MessageCircle, 
  Star, 
  TrendingUp, 
  TrendingDown,
  Activity,
  BarChart3,
  Calendar,
  Loader2
} from "lucide-react"
import { toast } from "sonner"

interface AnalyticsData {
  userMetrics: {
    totalUsers: number
    activeUsers: number
    newUsersThisMonth: number
    userGrowthRate: number
    userRetentionRate: number
  }
  marketplaceMetrics: {
    totalListings: number
    activeListings: number
    completedTransactions: number
    averageListingPrice: number
    topCrops: Array<{ cropType: string; count: number }>
  }
  engagementMetrics: {
    totalMessages: number
    totalReviews: number
    averageRating: number
    responseRate: number
  }
  timeSeriesData: {
    dates: string[]
    userRegistrations: number[]
    newListings: number[]
    messages: number[]
  }
}

export default function AnalyticsOverviewPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

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
      fetchAnalytics()
    }
  }, [status, session, router, timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics/overview?timeRange=${timeRange}`)
      
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        toast.error('Failed to fetch analytics data')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Failed to fetch analytics data')
    } finally {
      setLoading(false)
    }
  }

  const getGrowthIcon = (rate: number) => {
    if (rate > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (rate < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Activity className="h-4 w-4 text-gray-500" />
  }

  const getGrowthColor = (rate: number) => {
    if (rate > 0) return 'text-green-600'
    if (rate < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading analytics...</span>
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Overview</h1>
              <p className="text-lg text-gray-600">Platform performance and user behavior insights</p>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <Button onClick={fetchAnalytics} variant="outline">
                <Activity className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {analytics && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.userMetrics.totalUsers.toLocaleString()}</div>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      {getGrowthIcon(analytics.userMetrics.userGrowthRate)}
                      <span className={getGrowthColor(analytics.userMetrics.userGrowthRate)}>
                        {analytics.userMetrics.userGrowthRate > 0 ? '+' : ''}{analytics.userMetrics.userGrowthRate}%
                      </span>
                      <span>from last month</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.marketplaceMetrics.activeListings.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.marketplaceMetrics.totalListings.toLocaleString()} total listings
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.engagementMetrics.averageRating.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.engagementMetrics.totalReviews.toLocaleString()} total reviews
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.engagementMetrics.responseRate}%</div>
                    <p className="text-xs text-muted-foreground">
                      Message response rate
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Top Crops */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Crops by Listings</CardTitle>
                  <CardDescription>Most popular crops in the marketplace</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.marketplaceMetrics.topCrops.map((crop, index) => (
                      <div key={crop.cropType} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="font-medium">{crop.cropType}</span>
                        </div>
                        <span className="text-gray-600">{crop.count} listings</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth</CardTitle>
                    <CardDescription>New user registrations over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">Chart visualization coming soon</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Retention</CardTitle>
                    <CardDescription>User engagement and retention metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Retention Rate</span>
                        <span className="font-medium">{analytics.userMetrics.userRetentionRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Users</span>
                        <span className="font-medium">{analytics.userMetrics.activeUsers.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>New This Month</span>
                        <span className="font-medium">{analytics.userMetrics.newUsersThisMonth.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Marketplace Tab */}
            <TabsContent value="marketplace" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Marketplace Performance</CardTitle>
                    <CardDescription>Listing and transaction metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Listings</span>
                        <span className="font-medium">{analytics.marketplaceMetrics.totalListings.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Listings</span>
                        <span className="font-medium">{analytics.marketplaceMetrics.activeListings.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completed Transactions</span>
                        <span className="font-medium">{analytics.marketplaceMetrics.completedTransactions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Price</span>
                        <span className="font-medium">UGX {analytics.marketplaceMetrics.averageListingPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Listing Trends</CardTitle>
                    <CardDescription>New listings over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">Chart visualization coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Engagement Tab */}
            <TabsContent value="engagement" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Communication Metrics</CardTitle>
                    <CardDescription>Messaging and response rates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Messages</span>
                        <span className="font-medium">{analytics.engagementMetrics.totalMessages.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Response Rate</span>
                        <span className="font-medium">{analytics.engagementMetrics.responseRate}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Review Metrics</CardTitle>
                    <CardDescription>Rating and review statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Reviews</span>
                        <span className="font-medium">{analytics.engagementMetrics.totalReviews.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Rating</span>
                        <span className="font-medium">{analytics.engagementMetrics.averageRating.toFixed(1)}/5</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}
