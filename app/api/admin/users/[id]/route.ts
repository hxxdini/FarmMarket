import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { UserStatus } from '@/lib/generated/prisma'

// PUT /api/admin/users/[id] - Perform admin actions on users
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { Role: true }
    })

    if (adminUser?.Role.name !== 'admin' && adminUser?.Role.name !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 })
    }

    const { id } = await params
    const { action, roleName, permissions } = await req.json()

    if (!action || !['suspend', 'activate', 'verify', 'assign_role', 'assign_permissions'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "suspend", "activate", "verify", "assign_role", or "assign_permissions".' }, { status: 400 })
    }

    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        Role: { select: { name: true } }
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent admin from modifying superadmin
    if (targetUser.Role.name === 'superadmin' && adminUser.Role.name !== 'superadmin') {
      return NextResponse.json({ error: 'Cannot modify superadmin accounts' }, { status: 403 })
    }

    // Prevent admin from modifying themselves
    if (targetUser.id === adminUser.id) {
      return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 })
    }

    let updateData: any = {}
    let actionDescription = ''

    switch (action) {
      case 'suspend':
        updateData = { status: UserStatus.SUSPENDED, updatedAt: new Date() }
        actionDescription = 'suspended'
        break

      case 'activate':
        updateData = { status: UserStatus.ACTIVE, updatedAt: new Date() }
        actionDescription = 'activated'
        break

      case 'verify':
        updateData = {
          isEmailVerified: true,
          updatedAt: new Date()
        }
        actionDescription = 'verified'
        break

      case 'assign_role':
        if (!roleName) {
          return NextResponse.json({ error: 'roleName is required' }, { status: 400 })
        }
        const role = await prisma.role.findUnique({ where: { name: roleName } })
        if (!role) {
          return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
        }
        updateData = { roleId: role.id, updatedAt: new Date() }
        actionDescription = `role set to ${roleName}`
        break

      case 'assign_permissions':
        if (!Array.isArray(permissions)) {
          return NextResponse.json({ error: 'permissions must be an array of permission names' }, { status: 400 })
        }
        // Upsert permissions and set user permissions
        const perms = await Promise.all(
          permissions.map(async (name: string) => {
            return prisma.permission.upsert({
              where: { name },
              create: { 
                id: `perm_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
                name 
              },
              update: {}
            })
          })
        )
        const updatedPermUser = await prisma.user.update({
          where: { id },
          data: {
            Permission: {
              set: [],
              connect: perms.map(p => ({ id: p.id }))
            },
            updatedAt: new Date()
          },
          include: { Role: { select: { name: true } } }
        })
        await prisma.adminActionLog.create({
          data: {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            adminId: adminUser.id,
            action: 'USER_ASSIGN_PERMISSIONS',
            targetType: 'USER',
            targetId: id,
            details: { permissions },
            timestamp: new Date()
          }
        })
        return NextResponse.json({
          message: 'Permissions assigned',
          user: {
            id: updatedPermUser.id,
            role: updatedPermUser.Role.name
          }
        })
        
        
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        Role: { select: { name: true } }
      }
    })

    // Log the admin action
    await prisma.adminActionLog.create({
      data: {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        adminId: adminUser.id,
        action: `USER_${action.toUpperCase()}`,
        targetType: 'USER',
        targetId: id,
        details: {
          userId: id,
          action,
          userEmail: targetUser.email,
          userName: targetUser.name,
          userRole: targetUser.Role.name,
          adminEmail: session.user.email
        },
        timestamp: new Date()
      }
    })

    // TODO: Send notification to user about account status change
    // This would integrate with the notification system

    return NextResponse.json({
      message: `User ${actionDescription} successfully`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.Role.name,
        isEmailVerified: updatedUser.isEmailVerified,
        isPhoneVerified: updatedUser.isPhoneVerified,
        status: updatedUser.status === UserStatus.SUSPENDED ? 'suspended' : updatedUser.status === UserStatus.ACTIVE ? 'active' : 'pending'
      }
    })
  } catch (error) {
    console.error('Error performing user action:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to perform user action', details: errorMessage },
      { status: 500 }
    )
  }
}

// GET /api/admin/users/[id] - Get specific user details for admin
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { Role: true }
    })

    if (adminUser?.Role.name !== 'admin' && adminUser?.Role.name !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        Role: { select: { name: true } },
        ProductListing: {
          select: {
            id: true,
            cropType: true,
            status: true,
            createdAt: true
          }
        },
        Review_Review_reviewerIdToUser: {
          select: {
            id: true,
            rating: true,
            title: true,
            createdAt: true
          }
        },
        Review_Review_reviewedIdToUser: {
          select: {
            id: true,
            rating: true,
            title: true,
            createdAt: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate user statistics
    const userStats = {
      totalListings: user.ProductListing.length,
      activeListings: user.ProductListing.filter((l: any) => l.status === 'ACTIVE').length,
      totalReviewsGiven: user.Review_Review_reviewerIdToUser.length,
      totalReviewsReceived: user.Review_Review_reviewedIdToUser.length,
      averageRatingReceived: user.Review_Review_reviewedIdToUser.length > 0 
        ? user.Review_Review_reviewedIdToUser.reduce((sum: number, r: any) => sum + r.rating, 0) / user.Review_Review_reviewedIdToUser.length 
        : 0
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        avatar: user.avatar,
        bio: user.bio,
        role: user.Role.name,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString(),
        status: user.lastLoginAt ? 'active' : 'pending'
      },
      stats: userStats
    })
  } catch (error) {
    console.error('Error fetching user details for admin:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    )
  }
}
