import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

// GET /api/conversations/[id] - Get a specific conversation with messages
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get conversation and verify user is part of it
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        OR: [
          { user1Id: user.id },
          { user2Id: user.id }
        ]
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
            quantity: true,
            quality: true,
            location: true,
            status: true,
            User: {
              select: {
                id: true,
                name: true,
                location: true
              }
            },
            ProductImage: {
              where: { isPrimary: true },
              select: { url: true },
              take: 1
            }
          }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Get messages with pagination
    const messages = await prisma.message.findMany({
      where: { conversationId: id },
              include: {
          User_Message_senderIdToUser: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          Message: {
            select: {
              id: true,
              content: true,
              User_Message_senderIdToUser: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    // Get total message count
    const totalMessages = await prisma.message.count({
      where: { conversationId: id }
    })

    // Mark messages as read for the current user
    await prisma.message.updateMany({
      where: {
        conversationId: id,
        receiverId: user.id,
        status: { in: ['SENT', 'DELIVERED'] }
      },
      data: {
        status: 'READ',
        readAt: new Date()
      }
    })

    // Transform conversation data
    const otherUser = conversation.user1Id === user.id ? conversation.User_Conversation_user2IdToUser : conversation.User_Conversation_user1IdToUser
    const primaryImage = conversation.ProductListing?.ProductImage?.[0]?.url

    const transformedConversation = {
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
        quantity: conversation.ProductListing.quantity,
        quality: conversation.ProductListing.quality,
        location: conversation.ProductListing.location,
        status: conversation.ProductListing.status,
        farmer: conversation.ProductListing.User,
        image: primaryImage || '/placeholder.svg'
      } : null,
      messages: messages.reverse().map(msg => ({
        ...msg,
        sender: msg.User_Message_senderIdToUser,
        replyTo: msg.Message
      })), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        total: totalMessages,
        totalPages: Math.ceil(totalMessages / limit)
      },
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    }

    return NextResponse.json({ conversation: transformedConversation })
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/conversations/[id] - Archive a conversation
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify user is part of the conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        OR: [
          { user1Id: user.id },
          { user2Id: user.id }
        ]
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Archive the conversation
    await prisma.conversation.update({
      where: { id },
      data: { isArchived: true }
    })

    return NextResponse.json({ message: "Conversation archived successfully" })
  } catch (error) {
    console.error('Error archiving conversation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
