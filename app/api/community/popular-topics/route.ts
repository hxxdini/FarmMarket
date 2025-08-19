import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "5")

    // Get popular topics based on post count and engagement
    const popularTopics = await prisma.communityPost.groupBy({
      by: ['category'],
      where: { 
        status: "APPROVED"
      },
      _count: { category: true },
      _sum: { likes: true, repliesCount: true },
      orderBy: [
        { _count: { category: 'desc' } },
        { _sum: { likes: 'desc' } }
      ],
      take: limit
    })

    // Get popular crops
    const popularCrops = await prisma.communityPost.groupBy({
      by: ['crop'],
      where: { 
        status: "APPROVED"
      },
      _count: { crop: true },
      _sum: { likes: true, repliesCount: true },
      orderBy: [
        { _count: { crop: 'desc' } },
        { _sum: { likes: 'desc' } }
      ],
      take: limit
    })

    // Get trending topics (posts with high engagement in recent days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const trendingTopics = await prisma.communityPost.groupBy({
      by: ['category'],
      where: { 
        status: "APPROVED",
        createdAt: { gte: sevenDaysAgo }
      },
      _count: { category: true },
      _sum: { likes: true, repliesCount: true },
      orderBy: [
        { _sum: { likes: 'desc' } },
        { _count: { category: 'desc' } }
      ],
      take: limit
    })

    return NextResponse.json({
      popularTopics: popularTopics.map(topic => ({
        topic: topic.category,
        count: topic._count.category,
        engagement: (topic._sum.likes || 0) + (topic._sum.repliesCount || 0)
      })),
      popularCrops: popularCrops.map(crop => ({
        topic: crop.crop,
        count: crop._count.crop,
        engagement: (crop._sum.likes || 0) + (crop._sum.repliesCount || 0)
      })),
      trendingTopics: trendingTopics.map(topic => ({
        topic: topic.category,
        count: topic._count.category,
        engagement: (topic._sum.likes || 0) + (topic._sum.repliesCount || 0)
      }))
    })
  } catch (error) {
    console.error("Error fetching popular topics:", error)
    return NextResponse.json({ error: "Failed to fetch popular topics" }, { status: 500 })
  }
}
