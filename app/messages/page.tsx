"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, Search, Plus, Archive, Clock } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"

interface Conversation {
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
    status: string
    image: string
  }
  lastMessage?: {
    id: string
    content: string
    messageType: string
    createdAt: string
    senderId: string
    status: string
  }
  lastMessageAt?: string
  unreadCount: number
  createdAt: string
  updatedAt: string
}

export default function MessagesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      fetchConversations()
    }
  }, [status, router])

  useEffect(() => {
    // Filter conversations based on search query
    if (searchQuery.trim()) {
      const filtered = conversations.filter(conversation =>
        conversation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conversation.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conversation.listing?.cropType.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredConversations(filtered)
    } else {
      setFilteredConversations(conversations)
    }
  }, [searchQuery, conversations])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations)
      } else {
        toast.error('Failed to fetch conversations')
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      toast.error('Failed to fetch conversations')
    } finally {
      setLoading(false)
    }
  }

  const formatLastMessageTime = (timestamp?: string) => {
    if (!timestamp) return ''
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const truncateMessage = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <MessageCircle className="h-8 w-8 mr-3 text-green-600" />
                Messages
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Chat with buyers and sellers about your listings
              </p>
            </div>
            <Link href="/marketplace">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Browse Marketplace
              </Button>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="search"
                name="search"
                placeholder="Search conversations, users, or products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Conversations List */}
        {filteredConversations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {conversations.length === 0 ? "No conversations yet" : "No matching conversations"}
              </h3>
              <p className="text-gray-600 mb-6">
                {conversations.length === 0 
                  ? "Start chatting with buyers and sellers by browsing the marketplace"
                  : "Try adjusting your search terms"
                }
              </p>
              {conversations.length === 0 && (
                <Link href="/marketplace">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Browse Marketplace
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredConversations.map((conversation) => (
              <Card key={conversation.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer border-gray-200 hover:border-green-300 group">
                <Link href={`/messages/${conversation.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* User Avatar */}
                      <Avatar className="h-14 w-14 border-2 border-gray-100 group-hover:border-green-200 transition-colors">
                        <AvatarImage src={conversation.otherUser.avatar || undefined} />
                        <AvatarFallback className="text-lg font-semibold">
                          {conversation.otherUser.name.split(' ').map((n: string) => n.charAt(0)).join('').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Conversation Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-green-700 transition-colors">
                              {conversation.otherUser.name}
                            </h3>
                            
                            {/* Listing Info */}
                            {conversation.listing && (
                              <div className="flex items-center space-x-3 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-gray-300">
                                  <Image
                                    src={conversation.listing.image}
                                    alt={conversation.listing.cropType}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="flex-1">
                                  <span className="text-sm font-medium text-gray-900">
                                    {conversation.listing.cropType}
                                  </span>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-sm text-gray-600">
                                      ${conversation.listing.pricePerUnit}/{conversation.listing.unit}
                                    </span>
                                    <Badge 
                                      variant={conversation.listing.status === 'ACTIVE' ? 'default' : 'secondary'}
                                      className="text-xs px-2 py-1"
                                    >
                                      {conversation.listing.status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Last Message */}
                            {conversation.lastMessage && (
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                  {conversation.lastMessage.senderId === session?.user?.id ? (
                                    <span className="font-medium text-green-600">You: </span>
                                  ) : null}
                                  {truncateMessage(conversation.lastMessage.content)}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Time and Unread Count */}
                          <div className="flex flex-col items-end space-y-2">
                            <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatLastMessageTime(conversation.lastMessageAt)}
                            </div>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs px-3 py-1 font-medium">
                                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
