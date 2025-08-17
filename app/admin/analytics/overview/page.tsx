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
  Loader2,
  MapPin,
  DollarSign,
  AlertTriangle,
  Shield,
  PieChart,
  LineChart
} from "lucide-react"
import { toast } from "sonner"
import { 
  LineChart as RechartsLineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'

interface AnalyticsData {
  userMetrics: {
    totalUsers: number
    activeUsers: number
    newUsersThisPeriod: number
    userGrowthRate: number
    userRetentionRate: number
    roleDistribution: Array<{ role: string; count: number }>
  }
  marketplaceMetrics: {
    totalListings: number
    activeListings: number
    newListingsThisPeriod: number
    listingGrowthRate: number
    averageListingPrice: number
    topCrops: Array<{ cropType: string; count: number }>
    marketPriceTrends: Array<{ cropType: string; averagePrice: number }>
  }
  engagementMetrics: {
    totalMessages: number
    newMessagesThisPeriod: number
    totalReviews: number
    newReviewsThisPeriod: number
    averageRating: number
    responseRate: number
  }
  marketDataMetrics: {
    totalMarketPrices: number
    totalPriceAlerts: number
    adminActionsThisPeriod: number
  }
  regionalMetrics: {
    topLocations: Array<{ location: string; userCount: number }>
  }
  timeSeriesData: {
    dates: string[]
    userRegistrations: number[]
    newListings: number[]
    messages: number[]
    reviews: number[]
    marketPrices: number[]
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

  const formatCurrency = (amount: number) => {
    return `UGX ${amount.toLocaleString()}`
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`
  }

  // Chart colors
  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

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
              <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics Dashboard</h1>
              <p className="text-lg text-gray-600">Comprehensive platform performance and user behavior insights</p>
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(analytics.userMetrics.totalUsers)}</div>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      {getGrowthIcon(analytics.userMetrics.userGrowthRate)}
                      <span className={getGrowthColor(analytics.userMetrics.userGrowthRate)}>
                        {analytics.userMetrics.userGrowthRate > 0 ? '+' : ''}{formatPercentage(analytics.userMetrics.userGrowthRate)}
                      </span>
                      <span>from last period</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(analytics.marketplaceMetrics.activeListings)}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(analytics.marketplaceMetrics.totalListings)} total listings
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Market Prices</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(analytics.marketDataMetrics.totalMarketPrices)}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(analytics.marketDataMetrics.totalPriceAlerts)} price alerts
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Admin Actions</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(analytics.marketDataMetrics.adminActionsThisPeriod)}</div>
                    <p className="text-xs text-muted-foreground">
                      This period
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth Trend</CardTitle>
                    <CardDescription>New user registrations over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analytics.timeSeriesData.dates.map((date, index) => ({
                        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        users: analytics.timeSeriesData.userRegistrations[index]
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="users" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Top Crops Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Crops by Listings</CardTitle>
                    <CardDescription>Most popular crop types</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.marketplaceMetrics.topCrops}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="cropType" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Regional Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Regional User Distribution</CardTitle>
                  <CardDescription>Users by location</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {analytics.regionalMetrics.topLocations.map((location, index) => (
                      <div key={location.location} className="text-center p-4 bg-gray-50 rounded-lg">
                        <MapPin className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                        <div className="font-semibold text-sm">{location.location}</div>
                        <div className="text-lg font-bold text-blue-600">{formatNumber(location.userCount)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Role Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>User Role Distribution</CardTitle>
                    <CardDescription>Breakdown of users by role</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={analytics.userMetrics.roleDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ role, percent }) => `${role} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {analytics.userMetrics.roleDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* User Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>User Metrics</CardTitle>
                    <CardDescription>Key user performance indicators</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Active Users</span>
                      <span className="font-semibold">{formatNumber(analytics.userMetrics.activeUsers)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>New Users (This Period)</span>
                      <span className="font-semibold text-green-600">{formatNumber(analytics.userMetrics.newUsersThisPeriod)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>User Retention Rate</span>
                      <span className="font-semibold text-blue-600">{formatPercentage(analytics.userMetrics.userRetentionRate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Growth Rate</span>
                      <span className={`font-semibold ${getGrowthColor(analytics.userMetrics.userGrowthRate)}`}>
                        {analytics.userMetrics.userGrowthRate > 0 ? '+' : ''}{formatPercentage(analytics.userMetrics.userGrowthRate)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Marketplace Tab */}
            <TabsContent value="marketplace" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Listing Growth Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Listing Activity</CardTitle>
                    <CardDescription>New listings over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsLineChart data={analytics.timeSeriesData.dates.map((date, index) => ({
                        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        listings: analytics.timeSeriesData.newListings[index]
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="listings" stroke="#10b981" strokeWidth={2} />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Market Price Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle>Market Price Trends</CardTitle>
                    <CardDescription>Average prices by crop type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.marketplaceMetrics.marketPriceTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="cropType" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Bar dataKey="averagePrice" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Marketplace Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Marketplace Performance</CardTitle>
                  <CardDescription>Key marketplace indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{formatNumber(analytics.marketplaceMetrics.totalListings)}</div>
                      <div className="text-sm text-gray-600">Total Listings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{formatNumber(analytics.marketplaceMetrics.activeListings)}</div>
                      <div className="text-sm text-gray-600">Active Listings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{formatCurrency(analytics.marketplaceMetrics.averageListingPrice)}</div>
                      <div className="text-sm text-gray-600">Average Price</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Engagement Tab */}
            <TabsContent value="engagement" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Message Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Message Activity</CardTitle>
                    <CardDescription>Communication trends over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analytics.timeSeriesData.dates.map((date, index) => ({
                        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        messages: analytics.timeSeriesData.messages[index]
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="messages" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Review Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Review Activity</CardTitle>
                    <CardDescription>User feedback trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsLineChart data={analytics.timeSeriesData.dates.map((date, index) => ({
                        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        reviews: analytics.timeSeriesData.reviews[index]
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="reviews" stroke="#ef4444" strokeWidth={2} />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Engagement Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Overview</CardTitle>
                  <CardDescription>User interaction metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{formatNumber(analytics.engagementMetrics.totalMessages)}</div>
                      <div className="text-sm text-gray-600">Total Messages</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{formatNumber(analytics.engagementMetrics.totalReviews)}</div>
                      <div className="text-sm text-gray-600">Total Reviews</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600">{analytics.engagementMetrics.averageRating.toFixed(1)}</div>
                      <div className="text-sm text-gray-600">Average Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{formatPercentage(analytics.engagementMetrics.responseRate)}</div>
                      <div className="text-sm text-gray-600">Response Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              {/* Market Price Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Market Price Trends</CardTitle>
                  <CardDescription>Price submissions over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RechartsLineChart data={analytics.timeSeriesData.dates.map((date, index) => ({
                      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      prices: analytics.timeSeriesData.marketPrices[index]
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="prices" stroke="#06b6d4" strokeWidth={2} name="Market Prices" />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Combined Activity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Platform Activity Overview</CardTitle>
                  <CardDescription>All activities combined for trend analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RechartsLineChart data={analytics.timeSeriesData.dates.map((date, index) => ({
                      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      users: analytics.timeSeriesData.userRegistrations[index],
                      listings: analytics.timeSeriesData.newListings[index],
                      messages: analytics.timeSeriesData.messages[index],
                      reviews: analytics.timeSeriesData.reviews[index]
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} name="New Users" />
                      <Line type="monotone" dataKey="listings" stroke="#10b981" strokeWidth={2} name="New Listings" />
                      <Line type="monotone" dataKey="messages" stroke="#8b5cf6" strokeWidth={2} name="Messages" />
                      <Line type="monotone" dataKey="reviews" stroke="#ef4444" strokeWidth={2} name="Reviews" />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}
