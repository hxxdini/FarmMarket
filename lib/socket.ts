import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

export interface ServerToClientEvents {
  message_received: (message: any) => void
  message_updated: (message: any) => void
  message_deleted: (messageId: string) => void
  user_typing: (data: { userId: string, userName: string, conversationId: string }) => void
  user_stopped_typing: (data: { userId: string, conversationId: string }) => void
  conversation_updated: (conversation: any) => void
  // Analytics events
  analytics_updated: (data: { type: string; timestamp: Date }) => void
  user_registered: (data: { userId: string; timestamp: Date }) => void
  listing_created: (data: { listingId: string; timestamp: Date }) => void
  market_price_submitted: (data: { priceId: string; timestamp: Date }) => void
  review_submitted: (data: { reviewId: string; timestamp: Date }) => void
  message_sent: (data: { messageId: string; timestamp: Date }) => void
  community_post_created: (data: { postId: string; type: string; timestamp: Date }) => void
  community_reply_created: (data: { replyId: string; postId: string; timestamp: Date }) => void
  // New real-time events to replace auto-refresh
  marketplace_updated: (data: { newListings: number; totalListings: number; timestamp: Date }) => void
  price_alert_triggered: (data: { alertId: string; cropType: string; location: string; threshold: number; currentPrice: number; timestamp: Date }) => void
  notification_received: (data: { notificationId: string; type: string; message: string; timestamp: Date }) => void
  unread_messages_updated: (data: { unreadCount: number; conversationId?: string; timestamp: Date }) => void
}

export interface ClientToServerEvents {
  join_conversation: (conversationId: string) => void
  leave_conversation: (conversationId: string) => void
  typing: (conversationId: string) => void
  stop_typing: (conversationId: string) => void
  join_experts: () => void
  leave_experts: () => void
  send_message: (data: {
    conversationId: string
    content: string
    messageType?: string
    replyToId?: string
  }) => void
  // Analytics events
  join_analytics: () => void
  leave_analytics: () => void
  // New events to replace auto-refresh
  join_marketplace: () => void
  leave_marketplace: () => void
  join_notifications: () => void
  leave_notifications: () => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  userId: string
  userName: string
  userEmail: string
}

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>

export const initializeSocket = (server: HTTPServer) => {
  if (!io) {
    io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
      path: '/api/socket',
      cors: {
        origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
        methods: ['GET', 'POST']
      }
    })

    io.use(async (socket, next) => {
      try {
        // Get session from socket handshake
        const session = socket.handshake.auth.session
        if (!session?.user?.email) {
          return next(new Error('Unauthorized'))
        }

        // Get user from database
        const user = await prisma.user.findUnique({
          where: { email: session.user.email }
        })

        if (!user) {
          return next(new Error('User not found'))
        }

        // Store user data in socket
        socket.data.userId = user.id
        socket.data.userName = user.name || 'Unknown User'
        socket.data.userEmail = user.email

        next()
      } catch (error) {
        console.error('Socket authentication error:', error)
        next(new Error('Authentication failed'))
      }
    })

    io.on('connection', (socket) => {
      console.log(`User ${socket.data.userName} connected with socket ID: ${socket.id}`)

      // Join conversation room
      socket.on('join_conversation', async (conversationId) => {
        try {
          // Verify user is part of the conversation
          const conversation = await prisma.conversation.findFirst({
            where: {
              id: conversationId,
              OR: [
                { user1Id: socket.data.userId },
                { user2Id: socket.data.userId }
              ]
            }
          })

          if (conversation) {
            socket.join(`conversation:${conversationId}`)
            console.log(`User ${socket.data.userName} joined conversation: ${conversationId}`)
          }
        } catch (error) {
          console.error('Error joining conversation:', error)
        }
      })

      // Leave conversation room
      socket.on('leave_conversation', (conversationId) => {
        socket.leave(`conversation:${conversationId}`)
        console.log(`User ${socket.data.userName} left conversation: ${conversationId}`)
      })

      // Join analytics room (for admin users)
      socket.on('join_analytics', async () => {
        try {
          // Verify user is admin
          const user = await prisma.user.findUnique({
            where: { id: socket.data.userId },
            include: { Role: true }
          })

          if (user?.Role?.name === 'admin' || user?.Role?.name === 'superadmin') {
            socket.join('analytics')
            console.log(`Admin user ${socket.data.userName} joined analytics room`)
          }
        } catch (error) {
          console.error('Error joining analytics room:', error)
        }
      })

      // Leave analytics room
      socket.on('leave_analytics', () => {
        socket.leave('analytics')
        console.log(`User ${socket.data.userName} left analytics room`)
      })

      // Join marketplace room (for all authenticated users)
      socket.on('join_marketplace', () => {
        socket.join('marketplace')
        console.log(`User ${socket.data.userName} joined marketplace room`)
      })

      // Leave marketplace room
      socket.on('leave_marketplace', () => {
        socket.leave('marketplace')
        console.log(`User ${socket.data.userName} left marketplace room`)
      })

      // Join notifications room (for all authenticated users)
      socket.on('join_notifications', () => {
        socket.join('notifications')
        console.log(`User ${socket.data.userName} joined notifications room`)
      })

      // Leave notifications room
      socket.on('leave_notifications', () => {
        socket.leave('notifications')
        console.log(`User ${socket.data.userName} left notifications room`)
      })

      // Join experts room (for verified experts/officers)
      socket.on('join_experts', async () => {
        try {
          const user = await prisma.user.findUnique({
            where: { id: socket.data.userId },
            include: {
              Role: true,
              ExpertProfile: { select: { isVerified: true } }
            }
          })
          // Allow experts or extension officers with verified profile
          const roleName = user?.Role?.name
          const isExpertRole = roleName === 'expert' || roleName === 'extension_officer'
          const isVerified = user?.ExpertProfile?.isVerified
          if (isExpertRole && isVerified) {
            socket.join('experts')
            console.log(`Expert user ${socket.data.userName} joined experts room`)
          }
        } catch (error) {
          console.error('Error joining experts room:', error)
        }
      })

      socket.on('leave_experts', () => {
        socket.leave('experts')
        console.log(`User ${socket.data.userName} left experts room`)
      })

      // Handle typing indicators
      socket.on('typing', (conversationId) => {
        socket.to(`conversation:${conversationId}`).emit('user_typing', {
          userId: socket.data.userId,
          userName: socket.data.userName,
          conversationId
        })
      })

      socket.on('stop_typing', (conversationId) => {
        socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
          userId: socket.data.userId,
          conversationId
        })
      })

      // Handle real-time message sending
      socket.on('send_message', async (data) => {
        try {
          const { conversationId, content, messageType = 'TEXT', replyToId } = data

          if (!conversationId || !content?.trim()) {
            return
          }

          // Verify user is part of the conversation
          const conversation = await prisma.conversation.findFirst({
            where: {
              id: conversationId,
              OR: [
                { user1Id: socket.data.userId },
                { user2Id: socket.data.userId }
              ]
            }
          })

          if (!conversation) {
            return
          }

          // Determine receiver
          const receiverId = conversation.user1Id === socket.data.userId ? conversation.user2Id : conversation.user1Id

          // Create the message
          const message = await prisma.message.create({
            data: {
              id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              conversationId,
              senderId: socket.data.userId,
              receiverId,
              content: content.trim(),
              messageType: messageType as 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM' | 'OFFER',
              replyToId: replyToId || null,
              status: 'SENT',
              updatedAt: new Date()
            },
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
            }
          })

          // Update conversation's last message
          await prisma.conversation.update({
            where: { id: conversationId },
            data: {
              lastMessageId: message.id,
              lastMessageAt: message.createdAt
            }
          })

          // Emit the message to all users in the conversation
          io.to(`conversation:${conversationId}`).emit('message_received', message)

        } catch (error) {
          console.error('Error sending real-time message:', error)
        }
      })

      socket.on('disconnect', (reason) => {
        console.log(`User ${socket.data.userName} disconnected: ${reason}`)
      })
    })
  }

  return io
}

export const getSocket = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized')
  }
  return io
}

// Helper functions for emitting events from API routes
export const emitMessageReceived = (conversationId: string, message: any) => {
  if (io) {
    io.to(`conversation:${conversationId}`).emit('message_received', message)
  }
}

export const emitMessageUpdated = (conversationId: string, message: any) => {
  if (io) {
    io.to(`conversation:${conversationId}`).emit('message_updated', message)
  }
}

export const emitMessageDeleted = (conversationId: string, messageId: string) => {
  if (io) {
    io.to(`conversation:${conversationId}`).emit('message_deleted', messageId)
  }
}

// Analytics event helper functions
export const emitAnalyticsUpdated = (type: string) => {
  if (io) {
    io.to('analytics').emit('analytics_updated', { type, timestamp: new Date() })
  }
}

export const emitUserRegistered = (userId: string) => {
  if (io) {
    io.to('analytics').emit('user_registered', { userId, timestamp: new Date() })
  }
}

export const emitListingCreated = (listingId: string) => {
  if (io) {
    io.to('analytics').emit('listing_created', { listingId, timestamp: new Date() })
  }
}

export const emitMarketPriceSubmitted = (priceId: string) => {
  if (io) {
    io.to('analytics').emit('market_price_submitted', { priceId, timestamp: new Date() })
  }
}

export const emitReviewSubmitted = (reviewId: string) => {
  if (io) {
    io.to('analytics').emit('review_submitted', { reviewId, timestamp: new Date() })
  }
}

export const emitMessageSent = (messageId: string) => {
  if (io) {
    io.to('analytics').emit('message_sent', { messageId, timestamp: new Date() })
  }
}

export const emitCommunityPostCreated = (postId: string, type: string) => {
  if (io) {
    io.to('analytics').emit('community_post_created', { postId, type, timestamp: new Date() })
    io.to('experts').emit('community_post_created', { postId, type, timestamp: new Date() })
  }
}

export const emitCommunityReplyCreated = (replyId: string, postId: string) => {
  if (io) {
    io.to('analytics').emit('community_reply_created', { replyId, postId, timestamp: new Date() })
  }
}

// New helper functions for real-time updates to replace auto-refresh
export const emitMarketplaceUpdated = (newListings: number, totalListings: number) => {
  if (io) {
    io.to('marketplace').emit('marketplace_updated', { 
      newListings, 
      totalListings, 
      timestamp: new Date() 
    })
  }
}

export const emitPriceAlertTriggered = (alertId: string, cropType: string, location: string, threshold: number, currentPrice: number) => {
  if (io) {
    io.to('notifications').emit('price_alert_triggered', { 
      alertId, 
      cropType, 
      location, 
      threshold, 
      currentPrice, 
      timestamp: new Date() 
    })
  }
}

export const emitNotificationReceived = (notificationId: string, type: string, message: string) => {
  if (io) {
    io.to('notifications').emit('notification_received', { 
      notificationId, 
      type, 
      message, 
      timestamp: new Date() 
    })
  }
}

export const emitUnreadMessagesUpdated = (unreadCount: number, conversationId?: string) => {
  if (io) {
    io.to('notifications').emit('unread_messages_updated', { 
      unreadCount, 
      conversationId, 
      timestamp: new Date() 
    })
  }
}
