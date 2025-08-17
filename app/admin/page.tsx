"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  ShoppingCart, 
  MessageCircle, 
  Star, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Shield,
  Activity,
  BarChart3,
  RefreshCw,
  Clock,
  Loader2
} from "lucide-react"
import { toast } from "sonner"

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalListings: number
  activeListings: number
  totalMessages: number
  totalReviews: number
  pendingModeration: number
  flaggedContent: number
  pendingMarketPrices: number
  platformRevenue: number
  userGrowth: number
}

interface RecentActivity {
  id: string
  type: 'user_registration' | 'listing_created' | 'review_submitted' | 'message_sent' | 'user_suspended' | 'content_flagged' | 'market_price_submitted' | 'market_price_approved' | 'market_price_rejected'
  title: string
  description: string
  timestamp: string
  severity: 'low' | 'medium' | 'high'
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

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
      fetchDashboardData()
      
      // Set up real-time updates every 30 seconds
      const interval = setInterval(() => {
        fetchDashboardData(true) // Silent refresh
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [status, session, router])

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setRefreshing(true)
      
      const [statsResponse, activityResponse] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/activity?limit=15')
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        setRecentActivity(activityData.activities)
      }
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      if (!silent) {
        toast.error('Failed to load dashboard data')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration': return <Users className="h-4 w-4" />
      case 'listing_created': return <ShoppingCart className="h-4 w-4" />
      case 'review_submitted': return <Star className="h-4 w-4" />
      case 'message_sent': return <MessageCircle className="h-4 w-4" />
      case 'user_suspended': return <Users className="h-4 w-4" />
      case 'content_flagged': return <AlertTriangle className="h-4 w-4" />
      case 'market_price_submitted': return <TrendingUp className="h-4 w-4" />
      case 'market_price_approved': return <TrendingUp className="h-4 w-4" />
      case 'market_price_rejected': return <TrendingUp className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading admin dashboard...</span>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-base sm:text-lg text-gray-600">Real-time platform monitoring and management</p>
          {lastUpdated && (
            <div className="flex items-center space-x-2 mt-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-xs sm:text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData()}
            disabled={refreshing}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-center sm:text-left">
            <Shield className="h-4 w-4 mr-1" />
            Live Dashboard
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
        <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-blue-100 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">Total Users</CardTitle>
            <div className="p-1.5 sm:p-2 bg-blue-500 rounded-lg">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</div>
            <div className="flex items-center space-x-1 text-xs text-gray-600 mt-1">
              {stats?.userGrowth && stats.userGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-xs ${stats?.userGrowth && stats.userGrowth > 0 ? "text-green-600" : "text-red-600"}`}>
                {stats?.userGrowth && stats.userGrowth > 0 ? '+' : ''}{stats?.userGrowth || 0}% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-r from-green-50 to-green-100 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">Active Listings</CardTitle>
            <div className="p-1.5 sm:p-2 bg-green-500 rounded-lg">
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats?.activeListings || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats?.totalListings || 0} total listings
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-r from-purple-50 to-purple-100 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">Platform Reviews</CardTitle>
            <div className="p-1.5 sm:p-2 bg-purple-500 rounded-lg">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats?.totalReviews || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats?.totalMessages || 0} total messages
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-r from-orange-50 to-orange-100 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">Pending Moderation</CardTitle>
            <div className="p-1.5 sm:p-2 bg-orange-500 rounded-lg">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-bold text-orange-600">{stats?.pendingModeration || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats?.flaggedContent || 0} flagged items
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md bg-gradient-to-r from-yellow-50 to-yellow-100 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">Pending Prices</CardTitle>
            <div className="p-1.5 sm:p-2 bg-yellow-500 rounded-lg">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats?.pendingMarketPrices || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              Market prices awaiting review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg px-3 sm:px-6 py-3 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div>
                <CardTitle className="text-gray-800 text-base sm:text-lg">Recent Activity</CardTitle>
                <CardDescription className="text-gray-600 text-sm">Latest platform activities and events</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700 animate-pulse w-fit">
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0 max-h-80 sm:max-h-96 overflow-y-auto">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-gray-500">
                  <Activity className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                  <p className="text-sm sm:text-base">No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity, index) => (
                  <div key={activity.id} className={`flex items-start sm:items-center space-x-3 sm:space-x-4 p-3 sm:p-4 hover:bg-gray-50 transition-colors ${index !== recentActivity.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="flex-shrink-0 p-1.5 sm:p-2 bg-blue-100 rounded-full">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs sm:text-sm text-gray-500">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge className={`${getSeverityColor(activity.severity)} text-xs`}>
                      {activity.severity}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg px-3 sm:px-6 py-3 sm:py-6">
            <CardTitle className="text-gray-800 text-base sm:text-lg">Quick Actions</CardTitle>
            <CardDescription className="text-gray-600 text-sm">Frequently used admin functions</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Button 
                variant="outline" 
                className="h-20 sm:h-24 flex flex-col justify-center space-y-2 border-orange-200 hover:bg-orange-50 hover:border-orange-300 transition-all group"
                onClick={() => router.push('/admin/moderation/reviews')}
              >
                <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">Moderate Reviews</span>
                {stats?.pendingModeration && stats.pendingModeration > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {stats.pendingModeration}
                  </Badge>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 sm:h-24 flex flex-col justify-center space-y-2 border-yellow-200 hover:bg-yellow-50 hover:border-yellow-300 transition-all group"
                onClick={() => router.push('/admin/market-prices')}
              >
                <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">Review Prices</span>
                {stats?.pendingMarketPrices && stats.pendingMarketPrices > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {stats.pendingMarketPrices}
                  </Badge>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 sm:h-24 flex flex-col justify-center space-y-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all group"
                onClick={() => router.push('/admin/users')}
              >
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">Manage Users</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 sm:h-24 flex flex-col justify-center space-y-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all group"
                onClick={() => router.push('/admin/analytics/overview')}
              >
                <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">View Analytics</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 sm:h-24 flex flex-col justify-center space-y-2 border-green-200 hover:bg-green-50 hover:border-green-300 transition-all group col-span-1 sm:col-span-2"
                onClick={() => router.push('/marketplace')}
              >
                <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">View Marketplace</span>
              </Button>
              
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
