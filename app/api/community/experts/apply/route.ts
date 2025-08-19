import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const profile = await prisma.expertProfile.findUnique({ where: { userId: user.id } })
    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error fetching expert profile:', error)
    return NextResponse.json({ error: 'Failed to fetch expert profile' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await request.json()
    const { title, specialization, location, type = 'EXPERT' } = body || {}
    if (!title || !specialization) {
      return NextResponse.json({ error: 'title and specialization are required' }, { status: 400 })
    }

    const profile = await prisma.expertProfile.upsert({
      where: { userId: user.id },
      update: {
        title: title.trim(),
        specialization: specialization.trim(),
        location: location?.trim() || user.location || null,
        type: type === 'EXTENSION_OFFICER' ? 'EXTENSION_OFFICER' : 'EXPERT',
        updatedAt: new Date(),
      },
      create: {
        id: `expert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        userId: user.id,
        title: title.trim(),
        specialization: specialization.trim(),
        location: location?.trim() || user.location || null,
        type: type === 'EXTENSION_OFFICER' ? 'EXTENSION_OFFICER' : 'EXPERT',
        updatedAt: new Date(),
      }
    })

    return NextResponse.json({ profile, message: 'Application submitted. Awaiting verification.' }, { status: 201 })
  } catch (error) {
    console.error('Error applying for expert profile:', error)
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
  }
}


