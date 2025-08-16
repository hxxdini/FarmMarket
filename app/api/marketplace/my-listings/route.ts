import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const listings = await prisma.productListing.findMany({
      where: {
        User: {
          email: session.user.email
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        ProductImage: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            url: true,
            altText: true,
            isPrimary: true,
            order: true
          }
        }
      }
    })
    return NextResponse.json({ listings })
  } catch (error) {
    console.error('Error fetching listings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
