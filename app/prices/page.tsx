"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  MapPin,
  Grid3X3,
  List,
  Clock,
  CheckCircle,
  Users,
  Download,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"


export default function PricesPage() {
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

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRegion, setSelectedRegion] = useState("all")
  const [selectedCrop, setSelectedCrop] = useState("all")
  const [selectedQuality, setSelectedQuality] = useState("all")
  const [sortBy, setSortBy] = useState("updated")
  const [sortOrder, setSortOrder] = useState("desc")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Expanded mock data with more realistic entries
  const marketPrices = [
    {
      id: 1,
      crop: "Maize",
      price: 2500,
      unit: "kg",
      trend: "up",
      change: "+5%",
      changeValue: 125,
      market: "Kampala Central Market",
      region: "Central",
      quality: "Premium",
      lastUpdated: "2 hours ago",
      source: "verified",
      volume: 500,
      previousPrice: 2375,
    },
    {
      id: 2,
      crop: "Maize",
      price: 2400,
      unit: "kg",
      trend: "up",
      change: "+3%",
      changeValue: 70,
      market: "Nakawa Market",
      region: "Central",
      quality: "Standard",
      lastUpdated: "3 hours ago",
      source: "crowdsourced",
      volume: 300,
      previousPrice: 2330,
    },
    {
      id: 3,
      crop: "Maize",
      price: 2300,
      unit: "kg",
      trend: "stable",
      change: "0%",
      changeValue: 0,
      market: "Owino Market",
      region: "Central",
      quality: "Standard",
      lastUpdated: "1 hour ago",
      source: "verified",
      volume: 800,
      previousPrice: 2300,
    },
    {
      id: 4,
      crop: "Beans",
      price: 4200,
      unit: "kg",
      trend: "down",
      change: "-2%",
      changeValue: -85,
      market: "Mbale Market",
      region: "Eastern",
      quality: "Standard",
      lastUpdated: "1 hour ago",
      source: "crowdsourced",
      volume: 200,
      previousPrice: 4285,
    },
    {
      id: 5,
      crop: "Beans",
      price: 4500,
      unit: "kg",
      trend: "up",
      change: "+8%",
      changeValue: 333,
      market: "Soroti Market",
      region: "Eastern",
      quality: "Premium",
      lastUpdated: "4 hours ago",
      source: "verified",
      volume: 150,
      previousPrice: 4167,
    },
    {
      id: 6,
      crop: "Coffee",
      price: 8500,
      unit: "kg",
      trend: "up",
      change: "+12%",
      changeValue: 911,
      market: "Mukono Coffee Market",
      region: "Central",
      quality: "Premium",
      lastUpdated: "30 minutes ago",
      source: "verified",
      volume: 100,
      previousPrice: 7589,
    },
    {
      id: 7,
      crop: "Coffee",
      price: 7800,
      unit: "kg",
      trend: "up",
      change: "+15%",
      changeValue: 1017,
      market: "Jinja Market",
      region: "Eastern",
      quality: "Standard",
      lastUpdated: "2 hours ago",
      source: "verified",
      volume: 80,
      previousPrice: 6783,
    },
    {
      id: 8,
      crop: "Bananas",
      price: 1800,
      unit: "bunch",
      trend: "stable",
      change: "0%",
      changeValue: 0,
      market: "Masaka Market",
      region: "Central",
      quality: "Standard",
      lastUpdated: "3 hours ago",
      source: "crowdsourced",
      volume: 50,
      previousPrice: 1800,
    },
    {
      id: 9,
      crop: "Sweet Potatoes",
      price: 1200,
      unit: "kg",
      trend: "up",
      change: "+8%",
      changeValue: 89,
      market: "Gulu Market",
      region: "Northern",
      quality: "Standard",
      lastUpdated: "1 hour ago",
      source: "verified",
      volume: 400,
      previousPrice: 1111,
    },
    {
      id: 10,
      crop: "Cassava",
      price: 800,
      unit: "kg",
      trend: "down",
      change: "-3%",
      changeValue: -25,
      market: "Arua Market",
      region: "West Nile",
      quality: "Standard",
      lastUpdated: "4 hours ago",
      source: "crowdsourced",
      volume: 600,
      previousPrice: 825,
    },
    {
      id: 11,
      crop: "Rice",
      price: 3200,
      unit: "kg",
      trend: "up",
      change: "+6%",
      changeValue: 181,
      market: "Lira Market",
      region: "Northern",
      quality: "Premium",
      lastUpdated: "2 hours ago",
      source: "verified",
      volume: 250,
      previousPrice: 3019,
    },
    {
      id: 12,
      crop: "Groundnuts",
      price: 5500,
      unit: "kg",
      trend: "down",
      change: "-4%",
      changeValue: -229,
      market: "Mbarara Market",
      region: "Western",
      quality: "Standard",
      lastUpdated: "5 hours ago",
      source: "crowdsourced",
      volume: 180,
      previousPrice: 5729,
    },
  ]

  // Group prices by crop for better organization
  const groupedPrices = useMemo(() => {
    const filtered = marketPrices.filter((item) => {
      const matchesSearch =
        item.crop.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.market.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRegion = selectedRegion === "all" || item.region === selectedRegion
      const matchesCrop = selectedCrop === "all" || item.crop === selectedCrop
      const matchesQuality = selectedQuality === "all" || item.quality === selectedQuality

      return matchesSearch && matchesRegion && matchesCrop && matchesQuality
    })

    // Sort the filtered results
    const sorted = [...filtered].sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case "price":
          aValue = a.price
          bValue = b.price
          break
        case "change":
          aValue = a.changeValue
          bValue = b.changeValue
          break
        case "crop":
          aValue = a.crop
          bValue = b.crop
          break
        case "updated":
        default:
          // Convert time strings to comparable values (simplified)
          const timeToMinutes = (timeStr: string) => {
            const match = timeStr.match(/(\d+)\s*(hour|minute)/)
            if (!match) return 0
            const value = Number.parseInt(match[1])
            return match[2] === "hour" ? value * 60 : value
          }
          aValue = timeToMinutes(a.lastUpdated)
          bValue = timeToMinutes(b.lastUpdated)
          break
      }

      if (typeof aValue === "string") {
        return sortOrder === "asc" ? aValue.localeCompare(bValue as string) : (bValue as string).localeCompare(aValue)
      }

      return sortOrder === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
    })

    // Group by crop
    const grouped = sorted.reduce(
      (acc, item) => {
        if (!acc[item.crop]) {
          acc[item.crop] = []
        }
        acc[item.crop].push(item)
        return acc
      },
      {} as Record<string, typeof marketPrices>,
    )

    return grouped
  }, [marketPrices, searchTerm, selectedRegion, selectedCrop, selectedQuality, sortBy, sortOrder])

  // Get crop statistics
  const cropStats = useMemo(() => {
    return Object.entries(groupedPrices).map(([crop, prices]) => {
      const avgPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length
      const totalVolume = prices.reduce((sum, p) => sum + p.volume, 0)
      const priceRange = {
        min: Math.min(...prices.map((p) => p.price)),
        max: Math.max(...prices.map((p) => p.price)),
      }
      const avgChange = prices.reduce((sum, p) => sum + p.changeValue, 0) / prices.length

      return {
        crop,
        count: prices.length,
        avgPrice: Math.round(avgPrice),
        totalVolume,
        priceRange,
        avgChange: Math.round(avgChange),
        trend: avgChange > 0 ? "up" : avgChange < 0 ? "down" : "stable",
      }
    })
  }, [groupedPrices])

  const PriceCard = ({ item }: { item: (typeof marketPrices)[0] }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{item.crop}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <MapPin className="h-3 w-3 mr-1" />
              {item.market}
            </CardDescription>
          </div>
          <div className="flex items-center">
            {item.trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
            {item.trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
            <span
              className={`text-sm ml-1 font-medium ${
                item.trend === "up" ? "text-green-600" : item.trend === "down" ? "text-red-600" : "text-gray-600"
              }`}
            >
              {item.change}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-2xl font-bold text-gray-900">UGX {item.price.toLocaleString()}</p>
            <p className="text-sm text-gray-600">per {item.unit}</p>
            {item.previousPrice !== item.price && (
              <p className="text-xs text-gray-500">Previous: UGX {item.previousPrice.toLocaleString()}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs">
              {item.region}
            </Badge>
            <Badge variant={item.quality === "Premium" ? "default" : "outline"} className="text-xs">
              {item.quality}
            </Badge>
            <Badge variant={item.source === "verified" ? "default" : "secondary"} className="text-xs">
              {item.source === "verified" ? "Verified" : "Community"}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {item.lastUpdated}
            </span>
            <span>{item.volume}kg available</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const PriceRow = ({ item }: { item: (typeof marketPrices)[0] }) => (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-4 flex-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-gray-900">{item.crop}</h3>
            <Badge variant={item.quality === "Premium" ? "default" : "outline"} className="text-xs">
              {item.quality}
            </Badge>
          </div>
          <div className="flex items-center space-x-4 mt-1">
            <span className="text-sm text-gray-600 flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              {item.market}
            </span>
            <span className="text-sm text-gray-500">{item.region}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">UGX {item.price.toLocaleString()}</div>
          <div className="text-sm text-gray-600">per {item.unit}</div>
        </div>

        <div className="flex items-center space-x-1">
          {item.trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
          {item.trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
          <span
            className={`text-sm font-medium ${
              item.trend === "up" ? "text-green-600" : item.trend === "down" ? "text-red-600" : "text-gray-600"
            }`}
          >
            {item.change}
          </span>
        </div>

        <div className="text-right min-w-[80px]">
          <div className="flex items-center text-xs text-gray-500">
            {item.source === "verified" ? (
              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
            ) : (
              <Users className="h-3 w-3 mr-1 text-blue-500" />
            )}
            {item.source === "verified" ? "Verified" : "Community"}
          </div>
          <div className="text-xs text-gray-500 mt-1">{item.lastUpdated}</div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Market Prices</h1>
            <p className="text-gray-600 mt-1">Real-time crop prices from markets across Uganda</p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm">Submit Price</Button>
          </div>
        </div>

        <Tabs defaultValue="prices" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
            <TabsTrigger value="prices">Price Listings</TabsTrigger>
            <TabsTrigger value="analytics">Market Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="prices" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center">
                    <Filter className="h-5 w-5 mr-2" />
                    Filters & Search
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search crops or markets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                    <SelectTrigger id="crop" name="crop">
                      <SelectValue placeholder="Crop" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Crops</SelectItem>
                      <SelectItem value="Maize">Maize</SelectItem>
                      <SelectItem value="Beans">Beans</SelectItem>
                      <SelectItem value="Coffee">Coffee</SelectItem>
                      <SelectItem value="Rice">Rice</SelectItem>
                      <SelectItem value="Bananas">Bananas</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger id="region" name="region">
                      <SelectValue placeholder="Region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      <SelectItem value="Central">Central</SelectItem>
                      <SelectItem value="Eastern">Eastern</SelectItem>
                      <SelectItem value="Northern">Northern</SelectItem>
                      <SelectItem value="Western">Western</SelectItem>
                      <SelectItem value="West Nile">West Nile</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedQuality} onValueChange={setSelectedQuality}>
                    <SelectTrigger id="priceQuality" name="priceQuality">
                      <SelectValue placeholder="Quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Quality</SelectItem>
                      <SelectItem value="Premium">Premium</SelectItem>
                      <SelectItem value="Standard">Standard</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={`${sortBy}-${sortOrder}`}
                    onValueChange={(value) => {
                      const [sort, order] = value.split("-")
                      setSortBy(sort)
                      setSortOrder(order)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="updated-desc">Latest First</SelectItem>
                      <SelectItem value="updated-asc">Oldest First</SelectItem>
                      <SelectItem value="price-desc">Price: High to Low</SelectItem>
                      <SelectItem value="price-asc">Price: Low to High</SelectItem>
                      <SelectItem value="change-desc">Biggest Gains</SelectItem>
                      <SelectItem value="change-asc">Biggest Drops</SelectItem>
                      <SelectItem value="crop-asc">Crop A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Results Summary */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {Object.values(groupedPrices).flat().length} price updates
                {Object.keys(groupedPrices).length > 0 && ` across ${Object.keys(groupedPrices).length} crops`}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedRegion("all")
                  setSelectedCrop("all")
                  setSelectedQuality("all")
                  setSortBy("updated")
                  setSortOrder("desc")
                }}
              >
                Clear Filters
              </Button>
            </div>

            {/* Price Listings */}
            {Object.keys(groupedPrices).length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-gray-500 text-lg">No prices found matching your criteria</p>
                  <p className="text-gray-400 mt-2">Try adjusting your filters or search terms</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedPrices).map(([crop, prices]) => (
                  <div key={crop}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">{crop}</h2>
                      <Badge variant="secondary">{prices.length} markets</Badge>
                    </div>

                    {viewMode === "grid" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {prices.map((item) => (
                          <PriceCard key={item.id} item={item} />
                        ))}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="p-0">
                          {prices.map((item, index) => (
                            <PriceRow key={item.id} item={item} />
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cropStats.map((stat) => (
                <Card key={stat.crop}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{stat.crop}</CardTitle>
                      <div className="flex items-center">
                        {stat.trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
                        {stat.trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
                        <span
                          className={`text-sm ml-1 ${
                            stat.trend === "up"
                              ? "text-green-600"
                              : stat.trend === "down"
                                ? "text-red-600"
                                : "text-gray-600"
                          }`}
                        >
                          {stat.avgChange > 0 ? "+" : ""}
                          {stat.avgChange}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">UGX {stat.avgPrice.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Average price</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Markets</p>
                          <p className="font-medium">{stat.count}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Volume</p>
                          <p className="font-medium">{stat.totalVolume.toLocaleString()}kg</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Min Price</p>
                          <p className="font-medium">UGX {stat.priceRange.min.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Max Price</p>
                          <p className="font-medium">UGX {stat.priceRange.max.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Price Submission CTA */}
        <Card className="mt-8 bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Help Your Community</h3>
              <p className="text-green-700 mb-4">
                Submit current prices from your local market to help other farmers make informed decisions
              </p>
              <Button className="bg-green-600 hover:bg-green-700">Submit Market Price</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
