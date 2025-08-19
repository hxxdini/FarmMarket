"use client"

import { useState, Suspense } from "react"
import DOMPurify from "dompurify"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, ThumbsUp, Clock, HelpCircle, Lightbulb, AlertTriangle, BookOpen, Trophy } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"

function CommunityPageContent() {
  const [discussions, setDiscussions] = useState<any[]>([])
  const [isLoadingDiscussions, setIsLoadingDiscussions] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [communityStats, setCommunityStats] = useState<any>(null)
  const [popularTopics, setPopularTopics] = useState<any[]>([])
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  const [questionTitle, setQuestionTitle] = useState("")
  const [questionCategory, setQuestionCategory] = useState("")
  const [newQuestion, setNewQuestion] = useState("")
  const [experts, setExperts] = useState<any[]>([])
  const [expertsLoading, setExpertsLoading] = useState(true)
  const [isVerifiedExpert, setIsVerifiedExpert] = useState(false)
  // Advice form state
  const [adviceTitle, setAdviceTitle] = useState("")
  const [adviceCategory, setAdviceCategory] = useState("")
  const [adviceContent, setAdviceContent] = useState("")
  const [adviceError, setAdviceError] = useState<string | null>(null)
  // Alert form state
  const [alertTitle, setAlertTitle] = useState("")
  const [alertCategory, setAlertCategory] = useState("")
  const [alertContent, setAlertContent] = useState("")
  const [alertError, setAlertError] = useState<string | null>(null)
  // Success story form state
  const [successTitle, setSuccessTitle] = useState("")
  const [successCategory, setSuccessCategory] = useState("")
  const [successContent, setSuccessContent] = useState("")
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = (searchParams?.get("tab") as string) || "discussions"
  const [activeTab, setActiveTab] = useState<string>(initialTab)

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

  // Load community stats and popular topics
  useEffect(() => {
    let isCancelled = false
    async function loadStats() {
      try {
        setIsLoadingStats(true)
        const [statsRes, topicsRes] = await Promise.all([
          fetch("/api/community/stats", { cache: "no-store" }),
          fetch("/api/community/popular-topics", { cache: "no-store" })
        ])
        
        if (!isCancelled) {
          if (statsRes.ok) {
            const statsData = await statsRes.json()
            setCommunityStats(statsData)
          }
          
          if (topicsRes.ok) {
            const topicsData = await topicsRes.json()
            setPopularTopics(topicsData.popularTopics || [])
          }
        }
      } catch (err) {
        console.error("Failed to load stats:", err)
      } finally {
        if (!isCancelled) setIsLoadingStats(false)
      }
    }
    loadStats()
    return () => {
      isCancelled = true
    }
  }, [])

  // Load expert profile to determine if user is a verified expert (to show/hide certain tabs)
  useEffect(() => {
    let cancelled = false
    async function loadProfile() {
      try {
        const res = await fetch("/api/community/experts/apply", { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setIsVerifiedExpert(!!data?.profile?.isVerified)
        }
      } finally {
        // no-op
      }
    }
    loadProfile()
    return () => { cancelled = true }
  }, [])

  // Prevent non-experts from landing on or switching to the share-advice tab
  useEffect(() => {
    if (!isVerifiedExpert && activeTab === "share-advice") {
      setActiveTab("discussions")
    }
  }, [isVerifiedExpert, activeTab])

  async function handlePostQuestion() {
    if (!questionTitle || !questionCategory || !newQuestion) return
    const payload = {
      title: questionTitle,
      content: newQuestion,
      category: questionCategory,
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
      setNewQuestion("")
    }
  }

  async function handlePostAdvice() {
    setAdviceError(null)
    if (!adviceTitle || !adviceCategory || !adviceContent) return
    const payload = {
      title: adviceTitle,
      content: adviceContent,
      category: adviceCategory,
      type: "advice",
      author: session?.user?.name || "Anonymous",
      authorType: "expert",
    }
    const res = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const { discussion, message } = await res.json()
      setDiscussions((prev) => [discussion, ...prev])
      setAdviceTitle("")
      setAdviceCategory("")
      setAdviceContent("")
    } else if (res.status === 403) {
      const { error } = await res.json()
      setAdviceError(error || "Only verified experts can post advice")
    }
  }

  async function handlePostAlert() {
    setAlertError(null)
    if (!alertTitle || !alertCategory || !alertContent) return
    const payload = {
      title: alertTitle,
      content: alertContent,
      category: alertCategory,
      type: "alert",
      author: session?.user?.name || "Anonymous",
      authorType: "expert",
    }
    const res = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const { discussion } = await res.json()
      setDiscussions((prev) => [discussion, ...prev])
      setAlertTitle("")
      setAlertCategory("")
      setAlertContent("")
    } else if (res.status === 403) {
      const { error } = await res.json()
      setAlertError(error || "Only verified experts can post alerts")
    }
  }

  async function handlePostSuccess() {
    if (!successTitle || !successCategory || !successContent) return
    const payload = {
      title: successTitle,
      content: successContent,
      category: successCategory,
      type: "success",
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
      setSuccessTitle("")
      setSuccessCategory("")
      setSuccessContent("")
    }
  }

  async function handleToggleLike(postId: string, currentLikes: number) {
    try {
      const res = await fetch("/api/community/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      })
      
      if (res.ok) {
        const { liked } = await res.json()
        setDiscussions((prev) =>
          prev.map((discussion) =>
            discussion.id === postId
              ? {
                  ...discussion,
                  likes: liked ? currentLikes + 1 : Math.max(0, currentLikes - 1),
                  isLiked: liked,
                }
              : discussion
          )
        )
      }
    } catch (error) {
      console.error("Failed to toggle like:", error)
    }
  }

  useEffect(() => {
    let isCancelled = false
    async function loadExperts() {
      try {
        setExpertsLoading(true)
        const res = await fetch("/api/community/experts?limit=6", { cache: "no-store" })
        if (!res.ok) throw new Error(`Failed to load experts: ${res.status}`)
        const data = await res.json()
        if (!isCancelled) setExperts(data.experts || [])
      } catch (e) {
        // silently ignore on sidebar
      } finally {
        if (!isCancelled) setExpertsLoading(false)
      }
    }
    loadExperts()
    return () => { isCancelled = true }
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "question":
        return <HelpCircle className="h-4 w-4" />
      case "advice":
        return <Lightbulb className="h-4 w-4" />
      case "alert":
        return <AlertTriangle className="h-4 w-4" />
      case "success":
        return <Trophy className="h-4 w-4" />
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className={`grid w-full ${isVerifiedExpert ? 'grid-cols-6' : 'grid-cols-5'}`}>
                <TabsTrigger value="discussions">Discussions</TabsTrigger>
                <TabsTrigger value="ask">Ask Question</TabsTrigger>
                <TabsTrigger value="experts">Experts</TabsTrigger>
                {isVerifiedExpert && (
                  <TabsTrigger value="share-advice">Share Advice</TabsTrigger>
                )}
                <TabsTrigger value="report-alert">Report Alert</TabsTrigger>
                <TabsTrigger value="share-success">Share Success</TabsTrigger>
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
                  <Card key={discussion.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/community/${discussion.id}`)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`p-1 rounded ${getTypeColor(discussion.type)}`}>
                            {getTypeIcon(discussion.type)}
                          </div>
                          <Badge variant="outline">{discussion.category}</Badge>
                          {discussion.crop ? (
                            <Badge variant="secondary">{discussion.crop}</Badge>
                          ) : null}
                          {discussion.hasExpertReply && (
                            <Badge className="bg-green-100 text-green-800">Expert Reply</Badge>
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-lg hover:text-green-600 cursor-pointer">{discussion.title}</CardTitle>
                    </CardHeader>

                    <CardContent>
                      <div
                        className="text-gray-600 mb-4 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(discussion.content || "") }}
                      />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={discussion.authorAvatar || "/placeholder-user.jpg"} />
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleLike(discussion.id, discussion.likes)
                            }}
                            className="flex items-center hover:text-green-600 transition-colors"
                          >
                            <ThumbsUp className={`h-4 w-4 mr-1 ${discussion.isLiked ? 'text-green-600 fill-current' : ''}`} />
                            {discussion.likes}
                          </button>
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
                      disabled={!questionTitle || !questionCategory || !newQuestion}
                    >
                      Post Question
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="experts" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(expertsLoading ? [] : experts).map((expert: any, index: number) => (
                    <Card key={expert.id || index}>
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

              {isVerifiedExpert && (
              <TabsContent value="share-advice" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Share Expert Advice</CardTitle>
                    <CardDescription>Provide best practices and guidance for farmers</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {adviceError && (
                      <div className="text-sm text-red-600">{adviceError}</div>
                    )}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Title</label>
                      <Input
                        placeholder="E.g., Effective pest management for beans"
                        value={adviceTitle}
                        onChange={(e) => setAdviceTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Category</label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={adviceCategory}
                        onChange={(e) => setAdviceCategory(e.target.value)}
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
                      <label className="text-sm font-medium mb-2 block">Advice Content</label>
                      <Textarea
                        placeholder="Write clear, actionable guidance..."
                        value={adviceContent}
                        onChange={(e) => setAdviceContent(e.target.value)}
                        rows={6}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handlePostAdvice}
                      disabled={!adviceTitle || !adviceCategory || !adviceContent}
                    >
                      Share Advice
                    </Button>
                    <p className="text-xs text-gray-500 text-center">Only verified experts can publish advice. Submissions go through moderation.</p>
                  </CardContent>
                </Card>
              </TabsContent>
              )}

              <TabsContent value="report-alert" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Report Important Alert</CardTitle>
                    <CardDescription>Notify the community about urgent issues (diseases, weather, market risks)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {alertError && (
                      <div className="text-sm text-red-600">{alertError}</div>
                    )}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Title</label>
                      <Input
                        placeholder="E.g., Fall armyworm outbreak in Western region"
                        value={alertTitle}
                        onChange={(e) => setAlertTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Category</label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={alertCategory}
                        onChange={(e) => setAlertCategory(e.target.value)}
                      >
                        <option value="">Select category</option>
                        <option value="Pest Control">Pest Control</option>
                        <option value="Disease Management">Disease Management</option>
                        <option value="Weather">Weather</option>
                        <option value="Market">Market</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Alert Details</label>
                      <Textarea
                        placeholder="Describe the issue, location, and recommended actions..."
                        value={alertContent}
                        onChange={(e) => setAlertContent(e.target.value)}
                        rows={6}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handlePostAlert}
                      disabled={!alertTitle || !alertCategory || !alertContent}
                    >
                      Publish Alert
                    </Button>
                    <p className="text-xs text-gray-500 text-center">Only verified experts can publish alerts. Submissions go through moderation.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="share-success" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Share Success Story</CardTitle>
                    <CardDescription>Inspire others with what worked well for you</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Title</label>
                      <Input
                        placeholder="E.g., How I increased maize yield by 30%"
                        value={successTitle}
                        onChange={(e) => setSuccessTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Category</label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={successCategory}
                        onChange={(e) => setSuccessCategory(e.target.value)}
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
                      <label className="text-sm font-medium mb-2 block">Story</label>
                      <Textarea
                        placeholder="Share your experience, steps taken, and results..."
                        value={successContent}
                        onChange={(e) => setSuccessContent(e.target.value)}
                        rows={6}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handlePostSuccess}
                      disabled={!successTitle || !successCategory || !successContent}
                    >
                      Share Story
                    </Button>
                    <p className="text-xs text-gray-500 text-center">Stories are reviewed before appearing publicly.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-green-700" />
                  Knowledge Base
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Browse in-depth, expert-written articles and best practices curated from the community.
                </p>
                <Button asChild>
                  <Link href="/community/knowledge">Explore Knowledge</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Popular Topics</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, index) => (
                      <div key={index} className="flex justify-between items-center py-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                        <div className="h-5 bg-gray-200 rounded animate-pulse w-8"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {popularTopics.length > 0 ? (
                      popularTopics.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-1">
                          <span className="text-sm text-gray-600">{item.topic}</span>
                          <Badge variant="secondary" className="text-xs">
                            {item.count}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 text-center py-2">
                        No topics available
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Community Stats</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Users</span>
                      <span className="font-semibold">
                        {communityStats?.stats?.activeUsers?.toLocaleString() || "0"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Questions Answered</span>
                      <span className="font-semibold">
                        {communityStats?.stats?.questionsAnswered?.toLocaleString() || "0"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Expert Responses</span>
                      <span className="font-semibold">
                        {communityStats?.stats?.expertResponses?.toLocaleString() || "0"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Posts</span>
                      <span className="font-semibold">
                        {communityStats?.stats?.totalPosts?.toLocaleString() || "0"}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CommunityPageContent />
    </Suspense>
  )
}
