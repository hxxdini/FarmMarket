"use client"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Send, Image as ImageIcon, Paperclip, MoreVertical, Edit2, Trash2, Reply, X } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"

interface Message {
  id: string
  content: string
  messageType: string
  attachmentUrl?: string
  attachmentType?: string
  status: string
  readAt?: string
  deliveredAt?: string
  isEdited: boolean
  editedAt?: string
  createdAt: string
  updatedAt: string
  sender: {
    id: string
    name: string
    avatar?: string
  }
  replyTo?: {
    id: string
    content: string
    sender: {
      id: string
      name: string
    }
  }
}

interface ConversationData {
  id: string
  title: string
  otherUser: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  listing?: {
    id: string
    cropType: string
    pricePerUnit: number
    unit: string
    quantity: number
    quality: string
    location: string
    status: string
    farmer: {
      id: string
      name: string
      location: string
    }
    image: string
  }
  messages: Message[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  createdAt: string
  updatedAt: string
}

export default function ConversationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const conversationId = params.id as string

  const [conversation, setConversation] = useState<ConversationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [editContent, setEditContent] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated" && conversationId) {
      fetchConversation()
    }
  }, [status, router, conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [conversation?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchConversation = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/conversations/${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setConversation(data.conversation)
      } else if (response.status === 404) {
        toast.error('Conversation not found')
        router.push('/messages')
      } else {
        toast.error('Failed to fetch conversation')
      }
    } catch (error) {
      console.error('Error fetching conversation:', error)
      toast.error('Failed to fetch conversation')
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          content: newMessage.trim(),
          messageType: 'TEXT',
          replyToId: replyingTo?.id || null
        })
      })

      if (response.ok) {
        setNewMessage("")
        setReplyingTo(null)
        // Refresh conversation to get new message
        fetchConversation()
      } else {
        toast.error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleEditMessage = async () => {
    if (!editingMessage || !editContent.trim()) return

    try {
      const response = await fetch(`/api/messages/${editingMessage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() })
      })

      if (response.ok) {
        setEditingMessage(null)
        setEditContent("")
        fetchConversation()
        toast.success('Message updated')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update message')
      }
    } catch (error) {
      console.error('Error updating message:', error)
      toast.error('Failed to update message')
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchConversation()
        toast.success('Message deleted')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete message')
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      toast.error('Failed to delete message')
    }
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversation...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Conversation Not Found</h1>
          <p className="text-gray-600 mb-6">The conversation you're looking for doesn't exist or you don't have access to it.</p>
          <Link href="/messages">
            <Button>Back to Messages</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/messages">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            
            <Avatar className="h-10 w-10">
              <AvatarImage src={conversation.otherUser.avatar || undefined} />
              <AvatarFallback>
                {conversation.otherUser.name.split(' ').map((n: string) => n.charAt(0)).join('').substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {conversation.otherUser.name}
              </h1>
              {conversation.listing && (
                <p className="text-sm text-gray-600">
                  About: {conversation.listing.cropType} - ${conversation.listing.pricePerUnit}/{conversation.listing.unit}
                </p>
              )}
            </div>
          </div>

          {conversation.listing && (
            <Link href={`/marketplace/${conversation.listing.id}`}>
              <Button variant="outline" size="sm">
                View Listing
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Listing Info Card (if exists) */}
      {conversation.listing && (
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-6xl mx-auto">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="relative h-16 w-16 rounded-lg overflow-hidden">
                    <Image
                      src={conversation.listing.image}
                      alt={conversation.listing.cropType}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{conversation.listing.cropType}</h3>
                    <p className="text-sm text-gray-600">
                      ${conversation.listing.pricePerUnit}/{conversation.listing.unit} • {conversation.listing.quantity} {conversation.listing.unit} available
                    </p>
                    <p className="text-sm text-gray-600">
                      Quality: {conversation.listing.quality} • Location: {conversation.listing.location}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={conversation.listing.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {conversation.listing.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-6xl mx-auto h-full flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {conversation.messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              conversation.messages.map((message) => {
                const isOwnMessage = message.sender.id === session?.user?.id
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-6`}
                  >
                    {!isOwnMessage && (
                      <Avatar className="h-10 w-10 order-1 mr-3 flex-shrink-0">
                        <AvatarImage src={message.sender.avatar || undefined} />
                        <AvatarFallback className="text-sm font-medium">
                          {message.sender.name.split(' ').map((n: string) => n.charAt(0)).join('').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`max-w-md lg:max-w-lg ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                      {/* Reply Context */}
                      {message.replyTo && (
                        <div className="mb-3 px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 shadow-sm">
                          <div className="flex items-center space-x-2 mb-1">
                            <Reply className="h-3 w-3 text-gray-400" />
                            <p className="text-gray-600 font-medium text-xs">Replying to {message.replyTo.sender.name}</p>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed">{message.replyTo.content}</p>
                        </div>
                      )}
                      
                      {/* Message Bubble */}
                      <div
                        className={`px-5 py-3 rounded-2xl shadow-sm ${
                          isOwnMessage
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-900 shadow-md'
                        }`}
                      >
                        <p className="break-words leading-relaxed text-sm">{message.content}</p>
                        
                        <div className={`flex items-center justify-between mt-2 text-xs ${
                          isOwnMessage ? 'text-green-100' : 'text-gray-400'
                        }`}>
                          <span className="font-medium">{formatMessageTime(message.createdAt)}</span>
                          {message.isEdited && (
                            <span className="italic opacity-75">(edited)</span>
                          )}
                        </div>
                      </div>

                      {/* Message Actions */}
                      <div className={`flex items-center space-x-1 mt-2 ${
                        isOwnMessage ? 'justify-end' : 'justify-start'
                      }`}>
                        {isOwnMessage ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                              onClick={() => {
                                setEditingMessage(message)
                                setEditContent(message.content)
                              }}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                              onClick={() => handleDeleteMessage(message.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                            onClick={() => setReplyingTo(message)}
                          >
                            <Reply className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          {/* Reply Context */}
          {replyingTo && (
            <div className="mb-4 px-4 py-3 bg-blue-50 rounded-xl border border-blue-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Reply className="h-4 w-4 text-blue-500" />
                    <p className="text-sm text-blue-700 font-medium">Replying to {replyingTo.sender.name}</p>
                  </div>
                  <p className="text-sm text-blue-800 leading-relaxed">{replyingTo.content}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Edit Mode */}
          {editingMessage && (
            <div className="mb-4 px-4 py-3 bg-amber-50 rounded-xl border border-amber-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Edit2 className="h-4 w-4 text-amber-600" />
                  <p className="text-sm text-amber-700 font-medium">Editing message</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingMessage(null)
                    setEditContent("")
                  }}
                  className="text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-full p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex space-x-3">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="flex-1 resize-none border-amber-200 focus:border-amber-400"
                  rows={2}
                  placeholder="Edit your message..."
                />
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setEditingMessage(null)
                      setEditContent("")
                    }}
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleEditMessage} 
                    disabled={!editContent.trim()}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Message Input */}
          {!editingMessage && (
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <Textarea
                  ref={messageInputRef}
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="min-h-[44px] max-h-32 resize-none border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-xl"
                  rows={1}
                  disabled={sending}
                />
              </div>
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="h-11 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className="h-4 w-4" />
                    <span>Send</span>
                  </div>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
