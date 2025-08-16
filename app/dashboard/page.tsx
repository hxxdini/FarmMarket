"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Cloud, Users, ShoppingCart, Plus, MessageCircle } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }
  if (status === "unauthenticated") {
    return null
  }

  const marketPrices = [
    { crop: "Maize", price: 2500, unit: "kg", trend: "up", change: "+5%", market: "Kampala" },
    { crop: "Beans", price: 4200, unit: "kg", trend: "down", change: "-2%", market: "Mbale" },
    { crop: "Coffee", price: 8500, unit: "kg", trend: "up", change: "+12%", market: "Mukono" },
    { crop: "Bananas", price: 1800, unit: "bunch", trend: "stable", change: "0%", market: "Masaka" },
  ]

  const weatherAlert = {
    type: "warning",
    message: "Heavy rains expected in Central region. Protect your crops and harvest ready produce.",
    validUntil: "2024-01-20",
  }

  const userStats = {
    totalListings: 3,
    activeBids: 2,
    completedSales: 12,
    totalEarnings: 2450000,
  }

  const recentActivity = [
    {
      type: "sale",
      message: "Your maize listing received a new bid",
      time: "2 hours ago",
      amount: "UGX 125,000",
    },
    {
      type: "price_alert",
      message: "Coffee prices increased by 12% in Mukono",
      time: "4 hours ago",
    },
    {
      type: "weather",
      message: "Weather alert for your region",
      time: "6 hours ago",
    },
  ]

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
              <div className="text-2xl font-bold text-gray-900">{userStats.totalListings}</div>
              <p className="text-sm text-green-600">+1 this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Bids</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{userStats.activeBids}</div>
              <p className="text-sm text-blue-600">2 pending responses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completed Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{userStats.completedSales}</div>
              <p className="text-sm text-green-600">+3 this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">UGX {userStats.totalEarnings.toLocaleString()}</div>
              <p className="text-sm text-green-600">+15% this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Weather Alert */}
        {weatherAlert && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <Cloud className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-orange-800 font-medium">Weather Alert</p>
                  <p className="text-orange-700 text-sm mt-1">{weatherAlert.message}</p>
                  <p className="text-orange-600 text-xs mt-2">Valid until: {weatherAlert.validUntil}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                    <Link href="/prices">
                      <TrendingUp className="h-6 w-6 mb-2" />
                      Check Prices
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
                    <Link href="/community">
                      <MessageCircle className="h-6 w-6 mb-2" />
                      Ask Community
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
                    <Link href="/prices">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {marketPrices.map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{item.crop}</h3>
                        <div className="flex items-center">
                          {item.trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
                          {item.trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
                          <span
                            className={`text-sm ml-1 ${
                              item.trend === "up"
                                ? "text-green-600"
                                : item.trend === "down"
                                  ? "text-red-600"
                                  : "text-gray-600"
                            }`}
                          >
                            {item.change}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-gray-900">UGX {item.price.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">per {item.unit}</p>
                        <Badge variant="secondary" className="text-xs">
                          {item.market}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
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
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div
                        className={`p-2 rounded-full ${
                          activity.type === "sale"
                            ? "bg-green-100"
                            : activity.type === "price_alert"
                              ? "bg-blue-100"
                              : "bg-orange-100"
                        }`}
                      >
                        {activity.type === "sale" && <ShoppingCart className="h-4 w-4 text-green-600" />}
                        {activity.type === "price_alert" && <TrendingUp className="h-4 w-4 text-blue-600" />}
                        {activity.type === "weather" && <Cloud className="h-4 w-4 text-orange-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                        {activity.amount && <p className="text-sm font-medium text-green-600">{activity.amount}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Subscription Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Current Plan</span>
                    <Badge className="bg-green-600">Premium</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Expires</span>
                    <span className="text-sm font-medium">Feb 15, 2024</span>
                  </div>
                  <Button className="w-full bg-transparent" variant="outline">
                    Manage Subscription
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
