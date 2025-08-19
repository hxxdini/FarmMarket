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
  const [discussions, setDiscussions] = useState<any[]>([])
  const [isLoadingDiscussions, setIsLoadingDiscussions] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [questionTitle, setQuestionTitle] = useState("")
  const [questionCategory, setQuestionCategory] = useState("")
  const [questionCrop, setQuestionCrop] = useState("")
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

  useEffect(() => {
    let isCancelled = false
    async function loadDiscussions() {
      try {
        setIsLoadingDiscussions(true)
        const res = await fetch("/api/community", { cache: "no-store" })
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`)
        const data = await res.json()
        if (!isCancelled) setDiscussions(data.discussions || [])
      } catch (err: any) {
        if (!isCancelled) setLoadError(err?.message || "Failed to load discussions")
      } finally {
        if (!isCancelled) setIsLoadingDiscussions(false)
      }
    }
    loadDiscussions()
    return () => {
      isCancelled = true
    }
  }, [])

  async function handlePostQuestion() {
    if (!questionTitle || !questionCategory || !questionCrop || !newQuestion) return
    const payload = {
      title: questionTitle,
      content: newQuestion,
      category: questionCategory,
      crop: questionCrop,
      type: "question",
      author: session?.user?.name || "Anonymous",
      authorType: "farmer",
    }
    const res = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const { discussion } = await res.json()
      setDiscussions((prev) => [discussion, ...prev])
      setQuestionTitle("")
      setQuestionCategory("")
      setQuestionCrop("")
      setNewQuestion("")
    }
  }

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
                {isLoadingDiscussions && (
                  <Card>
                    <CardContent className="py-6">Loading discussions...</CardContent>
                  </Card>
                )}
                {loadError && (
                  <Card>
                    <CardContent className="py-6 text-red-600">{loadError}</CardContent>
                  </Card>
                )}
                {!isLoadingDiscussions && !loadError && discussions.map((discussion) => (
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
                                  .map((n: string) => n[0])
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
                      <Input
                        placeholder="What would you like to know?"
                        value={questionTitle}
                        onChange={(e) => setQuestionTitle(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Category</label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={questionCategory}
                        onChange={(e) => setQuestionCategory(e.target.value)}
                      >
                        <option value="">Select category</option>
                        <option value="Planting">Planting</option>
                        <option value="Pest Control">Pest Control</option>
                        <option value="Disease Management">Disease Management</option>
                        <option value="Harvesting">Harvesting</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Weather">Weather</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Crop Type</label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={questionCrop}
                        onChange={(e) => setQuestionCrop(e.target.value)}
                      >
                        <option value="">Select crop</option>
                        <option value="Maize">Maize</option>
                        <option value="Beans">Beans</option>
                        <option value="Coffee">Coffee</option>
                        <option value="Bananas">Bananas</option>
                        <option value="Other">Other</option>
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

                    <Button
                      className="w-full"
                      onClick={handlePostQuestion}
                      disabled={!questionTitle || !questionCategory || !questionCrop || !newQuestion}
                    >
                      Post Question
                    </Button>
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
                                .map((n: string) => n[0])
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
