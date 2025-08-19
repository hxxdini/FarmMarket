import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const where: any = { isVerified: true }
    if (q) {
      where.OR = [
        { user: { name: { contains: q, mode: "insensitive" } } },
        { specialization: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ]
    }

    const [experts, total] = await Promise.all([
      prisma.expertProfile.findMany({
        where,
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { rating: "desc" },
        skip,
        take: limit,
      }),
      prisma.expertProfile.count({ where }),
    ])

    const data = experts.map((e) => ({
      id: e.id,
      name: e.user.name || "Unknown",
      title: e.title || (e.type === 'EXTENSION_OFFICER' ? 'Agricultural Extension Officer' : 'Agricultural Expert'),
      specialization: e.specialization || 'General Agriculture',
      location: e.location || 'Unknown',
      rating: e.rating,
      responses: e.responses,
      avatar: e.user.avatar,
    }))

    return NextResponse.json({ experts: data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) {
    console.error("Error fetching experts:", error)
    return NextResponse.json({ error: "Failed to fetch experts" }, { status: 500 })
  }
}


