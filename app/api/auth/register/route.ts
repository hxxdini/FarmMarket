import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { emitUserRegistered } from '@/lib/socket'

const ALLOWED_ROLES = ['user', 'farmer']

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role } = await req.json()
    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Email, password, and role are required' }, { status: 400 })
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role selected' }, { status: 400 })
    }
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 })
    }
    const roleRecord = await prisma.role.findUnique({ where: { name: role } })
    if (!roleRecord) {
      return NextResponse.json({ error: 'Role not found' }, { status: 400 })
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        password: hashedPassword,
        name,
        roleId: roleRecord.id,
        updatedAt: new Date()
      },
    })

    // Emit real-time analytics event
    try {
      emitUserRegistered(user.id)
    } catch (socketError) {
      console.error('Failed to emit user registered event:', socketError)
      // Don't fail the registration if socket emission fails
    }

    return NextResponse.json({ message: 'User registered successfully', user: { id: user.id, email: user.email, name: user.name, role: roleRecord.name } }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 