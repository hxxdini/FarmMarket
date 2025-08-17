import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if ((session?.user as any)?.role !== 'admin' && (session?.user as any)?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const severity = searchParams.get('severity') || ''
    const dateRange = searchParams.get('dateRange') || ''
    
    const skip = (page - 1) * limit

    // Build date filter
    let dateFilter = {}
    if (dateRange && dateRange !== 'all') {
      const now = new Date()
      switch (dateRange) {
        case 'today':
          dateFilter = {
            timestamp: {
              gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
            }
          }
          break
        case 'week':
          const weekAgo = new Date(now)
          weekAgo.setDate(now.getDate() - 7)
          dateFilter = {
            timestamp: {
              gte: weekAgo
            }
          }
          break
        case 'month':
          const monthAgo = new Date(now)
          monthAgo.setMonth(now.getMonth() - 1)
          dateFilter = {
            timestamp: {
              gte: monthAgo
            }
          }
          break
      }
    }

    // Build where filter
    const where: any = {
      ...dateFilter,
      ...(type && type !== 'all' && { action: { contains: type } })
    }

    // Get admin action logs
    const [activities, total] = await Promise.all([
      prisma.adminActionLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit
      }),
      prisma.adminActionLog.count({ where })
    ])

    // Enhance activities with user data
    const enhancedActivities = await Promise.all(
      activities.map(async (activity) => {
        let userName = 'System'
        let userEmail = 'system@platform.com'
        
        try {
          const activityUser = await prisma.user.findUnique({
            where: { id: activity.adminId },
            select: { name: true, email: true }
          })
          if (activityUser) {
            userName = activityUser.name || activityUser.email
            userEmail = activityUser.email
          }
        } catch (error) {
          console.error('Error fetching user for activity:', error)
        }

        // Map severity based on action type
        let mappedSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low'
        if (activity.action.includes('delete') || activity.action.includes('suspend')) {
          mappedSeverity = 'critical'
        } else if (activity.action.includes('moderate') || activity.action.includes('flag')) {
          mappedSeverity = 'high'
        } else if (activity.action.includes('update') || activity.action.includes('edit')) {
          mappedSeverity = 'medium'
        }

        // Generate readable title and description
        const actionTitle = activity.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        const description = `${actionTitle} performed on ${activity.targetType || 'system'}`

        return {
          id: activity.id,
          type: activity.action,
          title: actionTitle,
          description,
          userId: activity.adminId,
          userName,
          userEmail,
          targetId: activity.targetId,
          targetType: activity.targetType,
          metadata: activity.details,
          severity: mappedSeverity,
          timestamp: activity.timestamp.toISOString(),
          ipAddress: null, // Not tracked in current schema
          userAgent: null  // Not tracked in current schema
        }
      })
    )

    // Apply search filter if provided
    const filteredActivities = search
      ? enhancedActivities.filter(activity =>
          activity.title.toLowerCase().includes(search.toLowerCase()) ||
          activity.description.toLowerCase().includes(search.toLowerCase()) ||
          activity.userName.toLowerCase().includes(search.toLowerCase()) ||
          activity.userEmail.toLowerCase().includes(search.toLowerCase())
        )
      : enhancedActivities

    // Apply severity filter if provided
    const severityFilteredActivities = severity && severity !== 'all'
      ? filteredActivities.filter(activity => activity.severity === severity)
      : filteredActivities

    return NextResponse.json({
      activities: severityFilteredActivities,
      hasMore: total > skip + limit,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching admin activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin activity' },
      { status: 500 }
    )
  }
}