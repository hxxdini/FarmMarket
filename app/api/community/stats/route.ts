import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Get community statistics
    const [
      totalPosts,
      totalUsers,
      totalExperts,
      totalReplies,
      topCategories,
      topCrops,
      recentActivity
    ] = await Promise.all([
      // Total posts
      prisma.communityPost.count({
        where: { status: "APPROVED" }
      }),
      
      // Total users
      prisma.user.count(),
      
      // Total verified experts
      prisma.expertProfile.count({
        where: { isVerified: true }
      }),
      
      // Total replies
      prisma.communityReply.count(),
      
      // Top categories by post count
      prisma.communityPost.groupBy({
        by: ['category'],
        where: { status: "APPROVED" },
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
        take: 10
      }),
      
      // Top crops by post count
      prisma.communityPost.groupBy({
        by: ['crop'],
        where: { 
          status: "APPROVED"
        },
        _count: { crop: true },
        orderBy: { _count: { crop: 'desc' } },
        take: 10
      }),
      
      // Recent activity (posts in last 7 days)
      prisma.communityPost.count({
        where: {
          status: "APPROVED",
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    // Calculate active users (users with posts or replies in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const activeUsers = await prisma.user.count({
      where: {
        OR: [
          {
            CommunityPost_CommunityPost_authorToUser: {
              some: {
                createdAt: { gte: thirtyDaysAgo }
              }
            }
          },
          {
            CommunityReply_CommunityReply_authorToUser: {
              some: {
                createdAt: { gte: thirtyDaysAgo }
              }
            }
          }
        ]
      }
    })

    // Calculate questions answered (posts with replies)
    const questionsAnswered = await prisma.communityPost.count({
      where: {
        status: "APPROVED",
        replies: { some: {} }
      }
    })

    // Calculate expert responses
    const expertResponses = await prisma.communityReply.count({
      where: { isExpert: true }
    })

    return NextResponse.json({
      stats: {
        totalPosts,
        totalUsers,
        activeUsers,
        totalExperts,
        totalReplies,
        questionsAnswered,
        expertResponses,
        recentActivity
      },
      topCategories: topCategories.map(cat => ({
        category: cat.category,
        count: cat._count.category
      })),
      topCrops: topCrops.map(crop => ({
        crop: crop.crop,
        count: crop._count.crop
      }))
    })
  } catch (error) {
    console.error("Error fetching community stats:", error)
    return NextResponse.json({ error: "Failed to fetch community stats" }, { status: 500 })
  }
}
