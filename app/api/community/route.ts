import { NextResponse } from "next/server"

type DiscussionType = "question" | "advice" | "alert" | "success"
type AuthorType = "farmer" | "expert" | "extension_officer"

interface CommunityDiscussion {
  id: number
  type: DiscussionType
  title: string
  author: string
  authorType: AuthorType
  content: string
  category: string
  crop: string
  replies: number
  likes: number
  timeAgo: string
  hasExpertReply: boolean
}

const mockDiscussions: CommunityDiscussion[] = [
  {
    id: 1,
    type: "question",
    title: "Best time to plant maize in Central Uganda?",
    author: "Peter Ssali",
    authorType: "farmer",
    content:
      "I'm planning to plant maize next month. What's the best timing considering the current weather patterns?",
    category: "Planting",
    crop: "Maize",
    replies: 8,
    likes: 12,
    timeAgo: "2 hours ago",
    hasExpertReply: true,
  },
  {
    id: 2,
    type: "advice",
    title: "Effective pest control for coffee plants",
    author: "Dr. Agnes Nalwoga",
    authorType: "expert",
    content: "Here are proven methods to control coffee berry borer without harmful chemicals...",
    category: "Pest Control",
    crop: "Coffee",
    replies: 15,
    likes: 28,
    timeAgo: "4 hours ago",
    hasExpertReply: false,
  },
  {
    id: 3,
    type: "alert",
    title: "Fall armyworm spotted in Wakiso district",
    author: "Extension Officer Mukono",
    authorType: "extension_officer",
    content:
      "Farmers in Wakiso should inspect their maize fields immediately. Early detection is crucial.",
    category: "Disease Alert",
    crop: "Maize",
    replies: 6,
    likes: 20,
    timeAgo: "6 hours ago",
    hasExpertReply: true,
  },
  {
    id: 4,
    type: "success",
    title: "Doubled my bean yield with this technique",
    author: "Mary Nakamya",
    authorType: "farmer",
    content:
      "I want to share how I increased my bean production using intercropping with maize...",
    category: "Success Story",
    crop: "Beans",
    replies: 22,
    likes: 45,
    timeAgo: "1 day ago",
    hasExpertReply: false,
  },
]

export async function GET() {
  return NextResponse.json({ discussions: mockDiscussions })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      title,
      content,
      category,
      crop,
      type = "question",
      author = "Anonymous",
      authorType = "farmer",
    } = body || {}

    if (!title || !content || !category || !crop) {
      return NextResponse.json(
        { error: "Missing required fields: title, content, category, crop" },
        { status: 400 }
      )
    }

    const newDiscussion: CommunityDiscussion = {
      id: Date.now(),
      type,
      title,
      author,
      authorType,
      content,
      category,
      crop,
      replies: 0,
      likes: 0,
      timeAgo: "Just now",
      hasExpertReply: false,
    }

    return NextResponse.json({ discussion: newDiscussion }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
}


