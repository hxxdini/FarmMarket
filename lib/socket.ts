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
}

export interface ClientToServerEvents {
  join_conversation: (conversationId: string) => void
  leave_conversation: (conversationId: string) => void
  typing: (conversationId: string) => void
  stop_typing: (conversationId: string) => void
  send_message: (data: {
    conversationId: string
    content: string
    messageType?: string
    replyToId?: string
  }) => void
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
              conversationId,
              senderId: socket.data.userId,
              receiverId,
              content: content.trim(),
              messageType,
              replyToId: replyToId || null,
              status: 'SENT'
            },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              },
              replyTo: {
                select: {
                  id: true,
                  content: true,
                  sender: {
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
