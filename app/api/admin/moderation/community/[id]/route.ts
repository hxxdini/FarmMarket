import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (!session || (role !== 'admin' && role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { action, reason } = body as { action: 'approve' | 'reject', reason?: string }
    if (!action) return NextResponse.json({ error: 'Action required' }, { status: 400 })

    const status = action === 'approve' ? 'APPROVED' : 'REJECTED'
    
    // Prepare update data
    const updateData: any = { 
      status, 
      updatedAt: new Date() 
    }

    const post = await prisma.communityPost.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Error moderating community post:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}


