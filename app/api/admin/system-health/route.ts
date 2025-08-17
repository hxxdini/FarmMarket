import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"
import { performance } from "perf_hooks"

// GET /api/admin/system-health - Fetch system health metrics
export async function GET(req: NextRequest) {
  try {
    // Check authentication and admin privileges
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { Role: true }
    })

    if (!user || !['admin', 'superadmin'].includes(user.Role?.name || '')) {
      return NextResponse.json({ error: "Access denied. Admin privileges required." }, { status: 403 })
    }

    // Get current timestamp for calculations
    const now = new Date()
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // Fetch system metrics
    const [
      totalUsers,
      activeUsers,
      totalListings,
      activeListings,
      totalMessages,
      totalReviews,
      pendingModeration,
      pendingMarketPrices,
      recentErrors,
      dbStats
    ] = await Promise.all([
      // User metrics
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastLoginAt: { gte: oneHourAgo }
        }
      }),
      
      // Listing metrics
      prisma.productListing.count(),
      prisma.productListing.count({
        where: {
          status: 'ACTIVE',
          OR: [
            { expiryDate: null },
            { expiryDate: { gt: now } }
          ]
        }
      }),
      
      // Communication metrics
      prisma.message.count(),
      prisma.review.count(),
      
      // Moderation metrics
      prisma.review.count({
        where: { status: 'PENDING' }
      }),
      prisma.marketPrice.count({
        where: { status: 'PENDING' }
      }),
      
      // Error tracking (from AdminActionLog)
      prisma.adminActionLog.findMany({
        where: {
          action: { in: ['ERROR', 'WARNING', 'CRITICAL_ERROR'] },
          timestamp: { gte: oneHourAgo }
        },
        orderBy: { timestamp: 'desc' },
        take: 10
      }),
      
      // Database performance metrics
      prisma.$queryRaw`SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity`
    ])

    // Calculate performance metrics (simulated for now)
    const performanceMetrics = {
      averageResponseTime: Math.random() * 200 + 50, // 50-250ms
      p95ResponseTime: Math.random() * 500 + 100,   // 100-600ms
      p99ResponseTime: Math.random() * 1000 + 200,  // 200-1200ms
      throughput: Math.random() * 50 + 10           // 10-60 req/s
    }

    // Calculate resource usage (simulated for now)
    const resourceMetrics = {
      cpuUsage: Math.random() * 30 + 20,           // 20-50%
      memoryUsage: Math.random() * 40 + 30,        // 30-70%
      diskUsage: Math.random() * 20 + 40,          // 40-60%
      networkLatency: Math.random() * 50 + 10      // 10-60ms
    }

    // Calculate server metrics
    const serverMetrics = {
      status: getServerStatus(performanceMetrics.averageResponseTime, resourceMetrics.cpuUsage),
      uptime: process.uptime(),
      responseTime: performanceMetrics.averageResponseTime,
      requestsPerMinute: Math.floor(performanceMetrics.throughput * 60),
      errorRate: calculateErrorRate(recentErrors.length, performanceMetrics.throughput * 60)
    }

    // Calculate database metrics
    const databaseMetrics = {
      status: getDatabaseStatus(dbStats[0] as any),
      connectionPool: (dbStats[0] as any)?.total_connections || 0,
      activeConnections: (dbStats[0] as any)?.active_connections || 0,
      queryPerformance: performanceMetrics.averageResponseTime * 0.3, // DB queries are typically faster
      slowQueries: Math.floor(Math.random() * 5) // Simulated slow query count
    }

    // Transform error logs
    const errorMetrics = {
      totalErrors: recentErrors.length,
      errorRate: serverMetrics.errorRate,
      criticalErrors: recentErrors.filter(e => e.action === 'CRITICAL_ERROR').length,
      recentErrors: recentErrors.map(error => ({
        id: error.id,
        type: error.action,
        message: error.details ? JSON.parse(error.details as string).message || 'Unknown error' : 'Unknown error',
        timestamp: error.timestamp.toISOString(),
        severity: getErrorSeverity(error.action)
      }))
    }

    // Determine overall system status
    const systemStatus = determineSystemStatus(serverMetrics, databaseMetrics, resourceMetrics)

    const systemMetrics = {
      server: serverMetrics,
      database: databaseMetrics,
      performance: performanceMetrics,
      resources: resourceMetrics,
      errors: errorMetrics,
      systemStatus
    }

    return NextResponse.json(systemMetrics)

  } catch (error) {
    console.error('Error fetching system health metrics:', error)
    return NextResponse.json(
      { error: "Failed to fetch system health metrics" },
      { status: 500 }
    )
  }
}

// Helper functions
function getServerStatus(responseTime: number, cpuUsage: number): 'healthy' | 'warning' | 'critical' {
  if (responseTime > 1000 || cpuUsage > 80) return 'critical'
  if (responseTime > 500 || cpuUsage > 60) return 'warning'
  return 'healthy'
}

function getDatabaseStatus(dbStats: any): 'healthy' | 'warning' | 'critical' {
  if (!dbStats) return 'warning'
  
  const activeRatio = dbStats.active_connections / dbStats.total_connections
  if (activeRatio > 0.9) return 'critical'
  if (activeRatio > 0.7) return 'warning'
  return 'healthy'
}

function calculateErrorRate(errorCount: number, totalRequests: number): number {
  if (totalRequests === 0) return 0
  return (errorCount / totalRequests) * 100
}

function getErrorSeverity(action: string): 'low' | 'medium' | 'high' | 'critical' {
  switch (action) {
    case 'CRITICAL_ERROR': return 'critical'
    case 'ERROR': return 'high'
    case 'WARNING': return 'medium'
    default: return 'low'
  }
}

function determineSystemStatus(
  server: any,
  database: any,
  resources: any
): 'healthy' | 'warning' | 'critical' {
  const statuses = [server.status, database.status]
  
  if (resources.cpuUsage > 80 || resources.memoryUsage > 85) {
    statuses.push('critical')
  } else if (resources.cpuUsage > 60 || resources.memoryUsage > 70) {
    statuses.push('warning')
  } else {
    statuses.push('healthy')
  }

  if (statuses.includes('critical')) return 'critical'
  if (statuses.includes('warning')) return 'warning'
  return 'healthy'
}
