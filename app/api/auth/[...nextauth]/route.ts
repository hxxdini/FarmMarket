import NextAuth from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { getRedisClient } from '@/lib/redis'
import { PrismaClient } from '@/lib/generated/prisma'
import { authOptions } from '@/lib/authOptions'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
