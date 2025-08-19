import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const adminUser = await prisma.user.findUnique({ where: { email: session.user.email }, include: { Role: true } })
    if (adminUser?.Role.name !== 'admin' && adminUser?.Role.name !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()
    const { action } = body as { action: 'verify' | 'revoke' }
    if (!action) return NextResponse.json({ error: 'Action required' }, { status: 400 })

    const isVerified = action === 'verify'
    const profile = await prisma.expertProfile.update({
      where: { id },
      data: { isVerified, updatedAt: new Date() }
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error moderating expert profile:', error)
    return NextResponse.json({ error: 'Failed to update expert' }, { status: 500 })
  }
}


