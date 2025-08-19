import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"
import { emitCommunityPostCreated } from "@/lib/socket"

const mapTypeToEnum = (type?: string) => {
  switch ((type || "").toLowerCase()) {
    case "question":
      return "QUESTION"
    case "advice":
      return "ADVICE"
    case "alert":
      return "ALERT"
    case "success":
      return "SUCCESS"
    default:
      return undefined
  }
}

const mapEnumToType = (enumVal: string) => enumVal.toLowerCase()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q") || ""
    const crop = searchParams.get("crop") || undefined
    const category = searchParams.get("category") || undefined
    const location = searchParams.get("location") || undefined
    const type = mapTypeToEnum(searchParams.get("type") || undefined)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const where: any = {
      status: "APPROVED",
    }
    if (type) where.type = type
    if (crop) where.crop = { contains: crop, mode: "insensitive" }
    if (category) where.category = { contains: category, mode: "insensitive" }
    if (location) where.location = { contains: location, mode: "insensitive" }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
        { crop: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
      ]
    }

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
              location: true,
              ExpertProfile: { select: { id: true, isVerified: true, type: true } }
            }
          },
          replies: {
            select: { id: true, isExpert: true },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.communityPost.count({ where }),
    ])

    const discussions = posts.map((p: any) => ({
      id: p.id,
      type: mapEnumToType(p.type),
      title: p.title,
      author: p.author.name || "Unknown",
      authorId: p.author.id,
      authorAvatar: p.author.avatar,
      authorType: p.author.ExpertProfile?.isVerified
        ? (p.author.ExpertProfile.type === 'EXTENSION_OFFICER' ? 'extension_officer' : 'expert')
        : 'farmer',
      content: p.content,
      category: p.category,
      crop: p.crop,
      replies: p.repliesCount,
      likes: p.likes,
      timeAgo: new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
        Math.round((p.createdAt.getTime() - Date.now()) / (1000 * 60 * 60)),
        "hour"
      ),
      hasExpertReply: p.replies.some((r: any) => r.isExpert),
    }))

    return NextResponse.json({
      discussions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error("Error fetching community posts:", error)
    return NextResponse.json({ error: "Failed to fetch community posts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const body = await request.json()
    const { title, content, category, crop, type = "question", location } = body || {}

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: "Missing required fields: title, content, category" },
        { status: 400 }
      )
    }

    const enumType = mapTypeToEnum(type) || "QUESTION"

    // If posting advice or alert, require verified expert profile
    if (enumType === 'ADVICE' || enumType === 'ALERT') {
      const expert = await prisma.expertProfile.findUnique({ where: { userId: user.id } })
      if (!expert || !expert.isVerified) {
        return NextResponse.json({ error: 'Only verified experts can post advice or alerts' }, { status: 403 })
      }
    }

    const post = await prisma.communityPost.create({
      data: {
        id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        authorId: user.id,
        title: title.trim(),
        content: content.trim(),
        category: category.trim(),
        crop: (typeof crop === 'string' && crop.trim().length > 0) ? crop.trim() : "General",
        location: location?.trim() || user.location || null,
        type: enumType as any,
        status: "PENDING",
        updatedAt: new Date(),
      },
      include: { author: { select: { id: true, name: true } } },
    })

    try {
      emitCommunityPostCreated(post.id, post.type)
    } catch (e) {
      // non-fatal
    }

    // Transform to UI shape
    const discussion = {
      id: post.id,
      type: mapEnumToType(post.type),
      title: post.title,
      author: post.author?.name || "Unknown",
      authorType: "farmer",
      content: post.content,
      category: post.category,
      crop: post.crop,
      replies: 0,
      likes: 0,
      timeAgo: "Just now",
      hasExpertReply: false,
      status: post.status,
    }

    return NextResponse.json({ discussion, message: "Submitted for review" }, { status: 201 })
  } catch (error) {
    console.error("Error creating community post:", error)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}


