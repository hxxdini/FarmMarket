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

// DELETE /api/admin/users/[id] - Delete a user
export async function DELETE(
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

    // Prevent admin from deleting superadmin
    if (targetUser.Role.name === 'superadmin' && adminUser.Role.name !== 'superadmin') {
      return NextResponse.json({ error: 'Cannot delete superadmin accounts' }, { status: 403 })
    }

    // Prevent admin from deleting themselves
    if (targetUser.id === adminUser.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Check if user has any active listings or important data
    const userData = await prisma.user.findUnique({
      where: { id },
      include: {
        ProductListing: {
          where: { status: 'ACTIVE' },
          select: { id: true }
        },
        Review_Review_reviewerIdToUser: {
          select: { id: true }
        },
        Review_Review_reviewedIdToUser: {
          select: { id: true }
        },
        CommunityPost_CommunityPost_authorToUser: {
          select: { id: true }
        },
        CommunityReply_CommunityReply_authorToUser: {
          select: { id: true }
        },
        PriceAlert: {
          select: { id: true }
        },
        MarketPrice_MarketPrice_submittedByToUser: {
          select: { id: true }
        }
      }
    })

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Log the deletion attempt
    await prisma.adminActionLog.create({
      data: {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        adminId: adminUser.id,
        action: 'USER_DELETE',
        targetType: 'USER',
        targetId: id,
        details: {
          userId: id,
          userEmail: targetUser.email,
          userName: targetUser.name,
          userRole: targetUser.Role.name,
          adminEmail: session.user.email,
          hasActiveListings: userData.ProductListing.length > 0,
          hasReviews: userData.Review_Review_reviewerIdToUser.length > 0 || userData.Review_Review_reviewedIdToUser.length > 0,
          hasCommunityPosts: userData.CommunityPost_CommunityPost_authorToUser.length > 0,
          hasPriceAlerts: userData.PriceAlert.length > 0,
          hasMarketPrices: userData.MarketPrice_MarketPrice_submittedByToUser.length > 0
        },
        timestamp: new Date()
      }
    })

    // Delete user and all related data
    // Note: This will cascade delete related records based on Prisma schema
    // But we need to manually handle relationships without cascade delete
    
    console.log(`Starting deletion process for user ${id}`)
    
    // First, handle Session model (no cascade delete)
    console.log('Deleting user sessions...')
    const deletedSessions = await prisma.session.deleteMany({
      where: { userId: id }
    })
    console.log(`Deleted ${deletedSessions.count} sessions`)
    
    // Handle MarketPrice reviewedBy references (no cascade delete)
    console.log('Updating market price reviews...')
    const updatedMarketPrices = await prisma.marketPrice.updateMany({
      where: { reviewedBy: id },
      data: { reviewedBy: null }
    })
    console.log(`Updated ${updatedMarketPrices.count} market prices`)
    
    // Handle Permission relationships (many-to-many, no cascade delete)
    console.log('Removing user permissions...')
    await prisma.user.update({
      where: { id },
      data: {
        Permission: {
          set: [] // Remove all permissions
        }
      }
    })
    console.log('Permissions removed')
    
    // Now delete the user
    console.log('Deleting user...')
    await prisma.user.delete({
      where: { id }
    })
    console.log('User deleted successfully')

    return NextResponse.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.Role.name
      }
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Handle Prisma constraint errors
    if (errorMessage.includes('Foreign key constraint failed')) {
      return NextResponse.json(
        { error: 'Cannot delete user due to existing references. Please remove all related data first.' },
        { status: 400 }
      )
    }
    
    // Handle specific Prisma errors
    if (errorMessage.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'User not found or already deleted' },
        { status: 404 }
      )
    }
    
    if (errorMessage.includes('Unique constraint failed')) {
      return NextResponse.json(
        { error: 'Cannot delete user due to unique constraint violation' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete user', details: errorMessage },
      { status: 500 }
    )
  }
}
