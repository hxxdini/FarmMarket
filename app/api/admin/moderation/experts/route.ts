import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

// POST /api/admin/moderation/experts - Create or update a user's ExpertProfile
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure caller is admin/superadmin
    const adminUser = await prisma.user.findUnique({ where: { email: session.user.email }, include: { Role: true } })
    if (adminUser?.Role.name !== 'admin' && adminUser?.Role.name !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, type, title, specialization, location, verify = true } = body || {}

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const normalizedType = type === 'EXTENSION_OFFICER' ? 'EXTENSION_OFFICER' : 'EXPERT'

    const profile = await prisma.expertProfile.upsert({
      where: { userId },
      update: {
        type: normalizedType,
        title: title?.trim() || undefined,
        specialization: specialization?.trim() || undefined,
        location: (location?.trim() || targetUser.location || undefined) as any,
        isVerified: verify ? true : undefined,
        updatedAt: new Date()
      },
      create: {
        id: `expert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        userId,
        type: normalizedType,
        title: title?.trim() || null,
        specialization: specialization?.trim() || null,
        location: (location?.trim() || targetUser.location || null) as any,
        isVerified: !!verify,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      message: `User set as ${normalizedType === 'EXTENSION_OFFICER' ? 'Extension Officer' : 'Expert'}${verify ? ' (verified)' : ''}`,
      profile
    })
  } catch (error) {
    console.error('Error upserting expert profile:', error)
    return NextResponse.json({ error: 'Failed to set expert profile' }, { status: 500 })
  }
}


