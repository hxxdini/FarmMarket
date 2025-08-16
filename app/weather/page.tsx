"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  Thermometer,
  AlertTriangle,
  MapPin,
  Calendar,
  TrendingUp,
} from "lucide-react"

export default function WeatherPage() {
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

  const currentWeather = {
    location: "Kampala, Central",
    temperature: 26,
    condition: "Partly Cloudy",
    humidity: 68,
    windSpeed: 12,
    rainfall: 0,
    icon: <Cloud className="h-8 w-8 text-gray-600" />,
  }

  const forecast = [
    {
      day: "Today",
      date: "Jan 17",
      high: 28,
      low: 19,
      condition: "Partly Cloudy",
      rainfall: 10,
      icon: <Cloud className="h-6 w-6 text-gray-600" />,
    },
    {
      day: "Tomorrow",
      date: "Jan 18",
      high: 24,
      low: 17,
      condition: "Heavy Rain",
      rainfall: 85,
      icon: <CloudRain className="h-6 w-6 text-blue-600" />,
    },
    {
      day: "Friday",
      date: "Jan 19",
      high: 22,
      low: 16,
      condition: "Rain",
      rainfall: 60,
      icon: <CloudRain className="h-6 w-6 text-blue-600" />,
    },
    {
      day: "Saturday",
      date: "Jan 20",
      high: 27,
      low: 18,
      condition: "Sunny",
      rainfall: 5,
      icon: <Sun className="h-6 w-6 text-yellow-500" />,
    },
    {
      day: "Sunday",
      date: "Jan 21",
      high: 29,
      low: 20,
      condition: "Sunny",
      rainfall: 0,
      icon: <Sun className="h-6 w-6 text-yellow-500" />,
    },
  ]

  const alerts = [
    {
      type: "warning",
      title: "Heavy Rain Alert",
      message: "Heavy rains expected tomorrow. Protect your crops and harvest ready produce.",
      region: "Central Uganda",
      validUntil: "Jan 19, 2024",
    },
    {
      type: "advisory",
      title: "Planting Advisory",
      message: "Good conditions for planting beans after the rain period ends.",
      region: "Central Uganda",
      validUntil: "Jan 25, 2024",
    },
  ]

  const agriculturalAdvice = [
    {
      crop: "Maize",
      advice: "Delay planting until after heavy rains. Ensure proper drainage in fields.",
      priority: "high",
    },
    {
      crop: "Beans",
      advice: "Good time to prepare land for planting after rain period.",
      priority: "medium",
    },
    {
      crop: "Coffee",
      advice: "Monitor for coffee berry disease during wet conditions.",
      priority: "high",
    },
    {
      crop: "Bananas",
      advice: "Ensure proper drainage around banana plants.",
      priority: "medium",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Weather & Agricultural Advice</h1>
          <p className="text-lg text-gray-600">
            Stay informed about weather conditions and get farming recommendations
          </p>
        </div>

        {/* Weather Alerts */}
        {alerts.length > 0 && (
          <div className="mb-8 space-y-4">
            {alerts.map((alert, index) => (
              <Card
                key={index}
                className={`border-l-4 ${
                  alert.type === "warning" ? "border-l-red-500 bg-red-50" : "border-l-yellow-500 bg-yellow-50"
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle
                      className={`h-5 w-5 mt-0.5 ${alert.type === "warning" ? "text-red-600" : "text-yellow-600"}`}
                    />
                    <div className="flex-1">
                      <h3 className={`font-medium ${alert.type === "warning" ? "text-red-800" : "text-yellow-800"}`}>
                        {alert.title}
                      </h3>
                      <p className={`text-sm mt-1 ${alert.type === "warning" ? "text-red-700" : "text-yellow-700"}`}>
                        {alert.message}
                      </p>
                      <div className="flex items-center mt-2 space-x-4 text-xs">
                        <span
                          className={`flex items-center ${
                            alert.type === "warning" ? "text-red-600" : "text-yellow-600"
                          }`}
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          {alert.region}
                        </span>
                        <span
                          className={`flex items-center ${
                            alert.type === "warning" ? "text-red-600" : "text-yellow-600"
                          }`}
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          Valid until: {alert.validUntil}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Weather Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Weather */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Current Weather
                </CardTitle>
                <CardDescription>{currentWeather.location}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-4">
                    {currentWeather.icon}
                    <div>
                      <div className="text-3xl font-bold text-gray-900">{currentWeather.temperature}°C</div>
                      <div className="text-gray-600">{currentWeather.condition}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="text-sm text-gray-600">Humidity</div>
                        <div className="font-medium">{currentWeather.humidity}%</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Wind className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-600">Wind</div>
                        <div className="font-medium">{currentWeather.windSpeed} km/h</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 5-Day Forecast */}
            <Card>
              <CardHeader>
                <CardTitle>5-Day Forecast</CardTitle>
                <CardDescription>Weather outlook for the coming days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {forecast.map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        {day.icon}
                        <div>
                          <div className="font-medium">{day.day}</div>
                          <div className="text-sm text-gray-600">{day.date}</div>
                        </div>
                        <div className="hidden sm:block">
                          <div className="text-sm text-gray-600">{day.condition}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-medium">
                            {day.high}°/{day.low}°
                          </div>
                          <div className="text-sm text-blue-600">{day.rainfall}% rain</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agricultural Advice */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Crop Advice
                </CardTitle>
                <CardDescription>Weather-based farming recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agriculturalAdvice.map((item, index) => (
                    <div key={index} className="border-l-2 border-green-200 pl-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900">{item.crop}</h4>
                        <Badge variant={item.priority === "high" ? "destructive" : "secondary"} className="text-xs">
                          {item.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{item.advice}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Weather Subscription */}
            <Card>
              <CardHeader>
                <CardTitle>Weather Alerts</CardTitle>
                <CardDescription>Get notified about important weather changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">SMS Alerts</span>
                    <Badge className="bg-green-600">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Push Notifications</span>
                    <Badge variant="secondary">Off</Badge>
                  </div>
                  <Button className="w-full bg-transparent" variant="outline">
                    Manage Alerts
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Calendar className="h-4 w-4 mr-2" />
                    Planting Calendar
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Thermometer className="h-4 w-4 mr-2" />
                    Historical Data
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
