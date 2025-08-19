import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"
import { emitUnreadMessagesUpdated } from "@/lib/socket"

// GET /api/conversations - Get all conversations for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get conversations where user is either user1 or user2
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1Id: user.id },
          { user2Id: user.id }
        ],
        isArchived: false
      },
      include: {
        User_Conversation_user1IdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        User_Conversation_user2IdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        ProductListing: {
          select: {
            id: true,
            cropType: true,
            pricePerUnit: true,
            unit: true,
            status: true,
            ProductImage: {
              where: { isPrimary: true },
              select: { url: true },
              take: 1
            }
          }
        },
        Message_Message_conversationIdToConversation: {
          where: {
            receiverId: user.id,
            status: { in: ['SENT', 'DELIVERED'] }
          },
          select: {
            id: true
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    })

    // Transform conversations to include other user info and unread count
    const transformedConversations = conversations.map(conversation => {
      const otherUser = conversation.user1Id === user.id ? conversation.User_Conversation_user2IdToUser : conversation.User_Conversation_user1IdToUser
      const primaryImage = conversation.ProductListing?.ProductImage?.[0]?.url

      return {
        id: conversation.id,
        title: conversation.title || `${conversation.ProductListing?.cropType || 'General'} - ${otherUser.name || 'Unknown User'}`,
        otherUser: {
          id: otherUser.id,
          name: otherUser.name || 'Unknown User',
          email: otherUser.email,
          avatar: otherUser.avatar
        },
        listing: conversation.ProductListing ? {
          id: conversation.ProductListing.id,
          cropType: conversation.ProductListing.cropType,
          pricePerUnit: conversation.ProductListing.pricePerUnit,
          unit: conversation.ProductListing.unit,
          status: conversation.ProductListing.status,
          image: primaryImage || '/placeholder.svg'
        } : null,
        lastMessage: null, // Will be fetched separately if needed
        lastMessageAt: conversation.lastMessageAt,
        unreadCount: conversation.Message_Message_conversationIdToConversation.length,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      }
    })

    return NextResponse.json({ conversations: transformedConversations })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/conversations - Create a new conversation
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { otherUserId, listingId, initialMessage } = body

    if (!otherUserId) {
      return NextResponse.json({ error: "Other user ID is required" }, { status: 400 })
    }

    // Get the current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (currentUser.id === otherUserId) {
      return NextResponse.json({ error: "Cannot create conversation with yourself" }, { status: 400 })
    }

    // Check if other user exists
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId }
    })

    if (!otherUser) {
      return NextResponse.json({ error: "Other user not found" }, { status: 404 })
    }

    // Check if listing exists (if provided)
    let listing = null
    if (listingId) {
      listing = await prisma.productListing.findUnique({
        where: { id: listingId }
      })

      if (!listing) {
        return NextResponse.json({ error: "Listing not found" }, { status: 404 })
      }
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: currentUser.id, user2Id: otherUserId, listingId },
          { user1Id: otherUserId, user2Id: currentUser.id, listingId }
        ]
      }
    })

    if (existingConversation) {
      return NextResponse.json({ 
        message: "Conversation already exists",
        conversation: { id: existingConversation.id }
      }, { status: 200 })
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user1Id: currentUser.id,
        user2Id: otherUserId,
        listingId,
        title: listing ? `${listing.cropType} - Discussion` : null,
        lastMessageAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        User_Conversation_user1IdToUser: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        User_Conversation_user2IdToUser: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        ProductListing: {
          select: {
            id: true,
            cropType: true,
            pricePerUnit: true,
            unit: true,
            status: true,
            ProductImage: {
              where: { isPrimary: true },
              select: { url: true },
              take: 1
            }
          }
        }
      }
    })

    // Create initial message if provided
    if (initialMessage && initialMessage.trim()) {
      const message = await prisma.message.create({
        data: {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          conversationId: conversation.id,
          senderId: currentUser.id,
          receiverId: otherUserId,
          content: initialMessage.trim(),
          messageType: 'TEXT',
          status: 'SENT',
          updatedAt: new Date()
        }
      })

      // Update conversation with last message
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageId: message.id,
          lastMessageAt: message.createdAt
        }
      })

      // Emit WebSocket event for unread message update
      try {
        const unreadCount = await prisma.message.count({
          where: {
            receiverId: otherUserId,
            status: { in: ['SENT', 'DELIVERED'] }
          }
        })
        emitUnreadMessagesUpdated(unreadCount, conversation.id)
      } catch (socketError) {
        console.error('Failed to emit unread messages update:', socketError)
        // Don't fail the conversation creation if socket emission fails
      }
    }

    // Transform response
    const otherUserData = conversation.user1Id === currentUser.id ? conversation.User_Conversation_user2IdToUser : conversation.User_Conversation_user1IdToUser
    const primaryImage = conversation.ProductListing?.ProductImage?.[0]?.url

    const transformedConversation = {
      id: conversation.id,
      title: conversation.title || `${conversation.ProductListing?.cropType || 'General'} - ${otherUserData.name || 'Unknown User'}`,
      otherUser: {
        id: otherUserData.id,
        name: otherUserData.name || 'Unknown User',
        email: otherUserData.email,
        avatar: otherUserData.avatar
      },
      listing: conversation.ProductListing ? {
        id: conversation.ProductListing.id,
        cropType: conversation.ProductListing.cropType,
        pricePerUnit: conversation.ProductListing.pricePerUnit,
        unit: conversation.ProductListing.unit,
        status: conversation.ProductListing.status,
        image: primaryImage || '/placeholder.svg'
      } : null,
      lastMessage: null,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount: 0,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    }

    return NextResponse.json({ 
      message: "Conversation created successfully",
      conversation: transformedConversation
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
