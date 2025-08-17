"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  HardDrive, 
  Memory, 
  Monitor, 
  RefreshCw, 
  Server, 
  Shield, 
  TrendingUp, 
  TrendingDown,
  Loader2,
  Wifi,
  WifiOff
} from "lucide-react"
import { toast } from "sonner"

interface SystemMetrics {
  server: {
    status: 'healthy' | 'warning' | 'critical'
    uptime: number
    responseTime: number
    requestsPerMinute: number
    errorRate: number
  }
  database: {
    status: 'healthy' | 'warning' | 'critical'
    connectionPool: number
    activeConnections: number
    queryPerformance: number
    slowQueries: number
  }
  performance: {
    averageResponseTime: number
    p95ResponseTime: number
    p99ResponseTime: number
    throughput: number
  }
  resources: {
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
    networkLatency: number
  }
  errors: {
    totalErrors: number
    errorRate: number
    criticalErrors: number
    recentErrors: Array<{
      id: string
      type: string
      message: string
      timestamp: string
      severity: 'low' | 'medium' | 'high' | 'critical'
    }>
  }
}

export default function SystemHealthPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
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
      fetchSystemMetrics()
      
      // Set up real-time updates every 15 seconds for system health
      const interval = setInterval(() => {
        fetchSystemMetrics(true) // Silent refresh
      }, 15000)
      
      return () => clearInterval(interval)
    }
  }, [status, session, router])

  const fetchSystemMetrics = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setRefreshing(true)
      
      const response = await fetch('/api/admin/system-health')
      
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
        setLastUpdated(new Date())
      } else {
        toast.error('Failed to fetch system metrics')
      }
    } catch (error) {
      console.error('Error fetching system metrics:', error)
      toast.error('Failed to fetch system metrics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />
      default: return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading system health dashboard...</span>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Server className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">System Metrics Unavailable</h2>
          <p className="text-gray-500 mb-4">Unable to fetch system health data</p>
          <Button onClick={fetchSystemMetrics}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Health Dashboard</h1>
            <p className="text-gray-600 mt-2">Real-time monitoring of platform performance and health</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdated?.toLocaleTimeString()}
            </div>
            <Button 
              onClick={fetchSystemMetrics} 
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Server Status */}
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Server Status</CardTitle>
              {getStatusIcon(metrics.server.status)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {metrics.server.status.charAt(0).toUpperCase() + metrics.server.status.slice(1)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Uptime: {formatUptime(metrics.server.uptime)}
              </p>
            </CardContent>
          </Card>

          {/* Database Status */}
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Database Status</CardTitle>
              {getStatusIcon(metrics.database.status)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {metrics.database.status.charAt(0).toUpperCase() + metrics.database.status.slice(1)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {metrics.database.activeConnections} active connections
              </p>
            </CardContent>
          </Card>

          {/* Error Rate */}
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Error Rate</CardTitle>
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {metrics.server.errorRate.toFixed(2)}%
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {metrics.errors.totalErrors} total errors
              </p>
            </CardContent>
          </Card>

          {/* Response Time */}
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Avg Response</CardTitle>
              <Clock className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {metrics.performance.averageResponseTime.toFixed(0)}ms
              </div>
              <p className="text-xs text-gray-600 mt-1">
                P95: {metrics.performance.p95ResponseTime.toFixed(0)}ms
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Metrics */}
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
          </TabsList>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Response Time Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Response Time Metrics</CardTitle>
                  <CardDescription>API performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Average Response Time</span>
                      <span className="font-medium">{metrics.performance.averageResponseTime.toFixed(0)}ms</span>
                    </div>
                    <Progress value={Math.min(metrics.performance.averageResponseTime / 1000 * 100, 100)} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>P95 Response Time</span>
                      <span className="font-medium">{metrics.performance.p95ResponseTime.toFixed(0)}ms</span>
                    </div>
                    <Progress value={Math.min(metrics.performance.p95ResponseTime / 1000 * 100, 100)} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>P99 Response Time</span>
                      <span className="font-medium">{metrics.performance.p99ResponseTime.toFixed(0)}ms</span>
                    </div>
                    <Progress value={Math.min(metrics.performance.p99ResponseTime / 1000 * 100, 100)} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Throughput Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Throughput & Load</CardTitle>
                  <CardDescription>Request handling capacity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Requests per Minute</span>
                      <span className="font-medium">{metrics.server.requestsPerMinute}</span>
                    </div>
                    <Progress value={Math.min(metrics.server.requestsPerMinute / 1000 * 100, 100)} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Throughput</span>
                      <span className="font-medium">{metrics.performance.throughput.toFixed(0)} req/s</span>
                    </div>
                    <Progress value={Math.min(metrics.performance.throughput / 100 * 100, 100)} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CPU & Memory */}
              <Card>
                <CardHeader>
                  <CardTitle>System Resources</CardTitle>
                  <CardDescription>Hardware utilization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>CPU Usage</span>
                      <span className="font-medium">{metrics.resources.cpuUsage.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.resources.cpuUsage} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Memory Usage</span>
                      <span className="font-medium">{metrics.resources.memoryUsage.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.resources.memoryUsage} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Disk Usage</span>
                      <span className="font-medium">{metrics.resources.diskUsage.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.resources.diskUsage} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Network */}
              <Card>
                <CardHeader>
                  <CardTitle>Network Performance</CardTitle>
                  <CardDescription>Connectivity metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Network Latency</span>
                      <span className="font-medium">{metrics.resources.networkLatency.toFixed(0)}ms</span>
                    </div>
                    <Progress value={Math.min(metrics.resources.networkLatency / 100 * 100, 100)} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Errors Tab */}
          <TabsContent value="errors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Errors</CardTitle>
                <CardDescription>Latest system errors and warnings</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics.errors.recentErrors.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
                    <p>No recent errors</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {metrics.errors.recentErrors.map((error) => (
                      <div key={error.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Badge className={getSeverityColor(error.severity)}>
                          {error.severity}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{error.type}</p>
                          <p className="text-sm text-gray-600">{error.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(error.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Tab */}
          <TabsContent value="database" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Connection Pool */}
              <Card>
                <CardHeader>
                  <CardTitle>Connection Pool</CardTitle>
                  <CardDescription>Database connection management</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Active Connections</span>
                      <span className="font-medium">{metrics.database.activeConnections}</span>
                    </div>
                    <Progress value={Math.min(metrics.database.activeConnections / 100 * 100, 100)} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Connection Pool Size</span>
                      <span className="font-medium">{metrics.database.connectionPool}</span>
                    </div>
                    <Progress value={Math.min(metrics.database.connectionPool / 100 * 100, 100)} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Query Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Query Performance</CardTitle>
                  <CardDescription>Database operation metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Query Performance</span>
                      <span className="font-medium">{metrics.database.queryPerformance.toFixed(0)}ms</span>
                    </div>
                    <Progress value={Math.min(metrics.database.queryPerformance / 1000 * 100, 100)} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Slow Queries</span>
                      <span className="font-medium">{metrics.database.slowQueries}</span>
                    </div>
                    <Progress value={Math.min(metrics.database.slowQueries / 100 * 100, 100)} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
