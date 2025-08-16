"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, ThumbsUp, Clock, HelpCircle, Lightbulb, AlertTriangle } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function CommunityPage() {
  const [newQuestion, setNewQuestion] = useState("")
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }
  if (status === "unauthenticated") {
    return null
  }

  const discussions = [
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
      content: "Farmers in Wakiso should inspect their maize fields immediately. Early detection is crucial.",
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
      content: "I want to share how I increased my bean production using intercropping with maize...",
      category: "Success Story",
      crop: "Beans",
      replies: 22,
      likes: 45,
      timeAgo: "1 day ago",
      hasExpertReply: false,
    },
  ]

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "question":
        return <HelpCircle className="h-4 w-4" />
      case "advice":
        return <Lightbulb className="h-4 w-4" />
      case "alert":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <MessageCircle className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "question":
        return "bg-blue-100 text-blue-800"
      case "advice":
        return "bg-green-100 text-green-800"
      case "alert":
        return "bg-red-100 text-red-800"
      case "success":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAuthorBadge = (authorType: string) => {
    switch (authorType) {
      case "expert":
        return <Badge className="bg-green-600">Expert</Badge>
      case "extension_officer":
        return <Badge className="bg-blue-600">Extension Officer</Badge>
      default:
        return <Badge variant="secondary">Farmer</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="discussions" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="discussions">Discussions</TabsTrigger>
                <TabsTrigger value="ask">Ask Question</TabsTrigger>
                <TabsTrigger value="experts">Experts</TabsTrigger>
              </TabsList>

              <TabsContent value="discussions" className="space-y-4">
                {discussions.map((discussion) => (
                  <Card key={discussion.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`p-1 rounded ${getTypeColor(discussion.type)}`}>
                            {getTypeIcon(discussion.type)}
                          </div>
                          <Badge variant="outline">{discussion.category}</Badge>
                          <Badge variant="secondary">{discussion.crop}</Badge>
                          {discussion.hasExpertReply && (
                            <Badge className="bg-green-100 text-green-800">Expert Reply</Badge>
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-lg hover:text-green-600 cursor-pointer">{discussion.title}</CardTitle>
                    </CardHeader>

                    <CardContent>
                      <p className="text-gray-600 mb-4 line-clamp-2">{discussion.content}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src="/placeholder.svg" />
                              <AvatarFallback>
                                {discussion.author
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-600">{discussion.author}</span>
                            {getAuthorBadge(discussion.authorType)}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            {discussion.timeAgo}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            {discussion.likes}
                          </div>
                          <div className="flex items-center">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            {discussion.replies}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="ask" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Ask the Community</CardTitle>
                    <CardDescription>Get help from fellow farmers and agricultural experts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Question Title</label>
                      <Input placeholder="What would you like to know?" />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Category</label>
                      <select className="w-full p-2 border rounded-md">
                        <option>Select category</option>
                        <option>Planting</option>
                        <option>Pest Control</option>
                        <option>Disease Management</option>
                        <option>Harvesting</option>
                        <option>Marketing</option>
                        <option>Weather</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Crop Type</label>
                      <select className="w-full p-2 border rounded-md">
                        <option>Select crop</option>
                        <option>Maize</option>
                        <option>Beans</option>
                        <option>Coffee</option>
                        <option>Bananas</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Detailed Question</label>
                      <Textarea
                        placeholder="Provide more details about your question..."
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <Button className="w-full">Post Question</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="experts" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      name: "Dr. Agnes Nalwoga",
                      title: "Agricultural Extension Officer",
                      specialization: "Coffee & Cash Crops",
                      location: "Mukono District",
                      rating: 4.9,
                      responses: 156,
                    },
                    {
                      name: "Prof. James Mwesigwa",
                      title: "Crop Protection Specialist",
                      specialization: "Pest & Disease Management",
                      location: "Makerere University",
                      rating: 4.8,
                      responses: 203,
                    },
                  ].map((expert, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex items-start space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback>
                              {expert.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold">{expert.name}</h3>
                            <p className="text-sm text-gray-600">{expert.title}</p>
                            <p className="text-sm text-green-600">{expert.specialization}</p>
                            <p className="text-xs text-gray-500 mt-1">{expert.location}</p>
                            <div className="flex items-center mt-2 space-x-4 text-sm">
                              <span>⭐ {expert.rating}</span>
                              <span>{expert.responses} responses</span>
                            </div>
                            <Button size="sm" className="mt-3">
                              Ask Question
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Popular Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { topic: "Maize planting", count: 45 },
                    { topic: "Coffee diseases", count: 32 },
                    { topic: "Bean varieties", count: 28 },
                    { topic: "Weather patterns", count: 24 },
                    { topic: "Market prices", count: 19 },
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600">{item.topic}</span>
                      <Badge variant="secondary" className="text-xs">
                        {item.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Community Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Farmers</span>
                    <span className="font-semibold">2,847</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Questions Answered</span>
                    <span className="font-semibold">1,256</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Expert Responses</span>
                    <span className="font-semibold">432</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
