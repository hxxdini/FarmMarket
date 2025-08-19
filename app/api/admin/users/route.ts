import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { UserStatus } from '@/lib/generated/prisma'
import bcrypt from 'bcryptjs'
import { emitUserRegistered } from '@/lib/socket'

// GET /api/admin/users - Get users for admin management
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { Role: true }
    })

    if (user?.Role.name !== 'admin' && user?.Role.name !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || 'all'
    const status = searchParams.get('status') || 'all'
    const verification = searchParams.get('verification') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause based on filters
    const where: any = {}

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Role filter
    if (role !== 'all') {
      where.Role = { name: role }
    }

    // Status filter using User.status enum
    if (status !== 'all') {
      if (status === 'active') {
        where.status = UserStatus.ACTIVE
      } else if (status === 'suspended') {
        where.status = UserStatus.SUSPENDED
      } else if (status === 'pending') {
        where.status = UserStatus.PENDING
      }
    }

    // Verification filter
    if (verification !== 'all') {
      if (verification === 'verified') {
        where.isEmailVerified = true
      } else if (verification === 'unverified') {
        where.isEmailVerified = false
      }
    }

    // Fetch users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          Role: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    // Transform users to include role name and status
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
      avatar: user.avatar,
      role: user.Role.name,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString(),
      status: user.status === UserStatus.ACTIVE ? 'active' : user.status === UserStatus.SUSPENDED ? 'suspended' : 'pending'
    }))

    return NextResponse.json({
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching users for admin:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users for admin' },
      { status: 500 }
    )
  }
}

// POST /api/admin/users - Create a new user (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({ where: { email: session.user.email }, include: { Role: true } })
    if (admin?.Role.name !== 'admin' && admin?.Role.name !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 })
    }

    const body = await req.json()
    const { name, email, phone, password, roleName = 'user', status = 'ACTIVE' } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const role = await prisma.role.findUnique({ where: { name: roleName } })
    if (!role) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const created = await prisma.user.create({
      data: {
        name: name || null,
        email,
        phone: phone || null,
        password: hashedPassword,
        roleId: role.id,
        status: status === 'SUSPENDED' ? UserStatus.SUSPENDED : status === 'PENDING' ? UserStatus.PENDING : UserStatus.ACTIVE
      },
      include: { Role: true }
    })

    // Emit real-time analytics event
    try {
      emitUserRegistered(created.id)
    } catch (socketError) {
      console.error('Failed to emit user registered event:', socketError)
      // Don't fail the user creation if socket emission fails
    }

    return NextResponse.json({
      message: 'User created',
      user: {
        id: created.id,
        name: created.name,
        email: created.email,
        role: created.Role.name,
        status: created.status
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
