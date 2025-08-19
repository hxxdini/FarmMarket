"use client"

import { useEffect, useState } from "react"
import DOMPurify from "dompurify"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export default function CommunityPostDetailPage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const [post, setPost] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [nestedReplyContent, setNestedReplyContent] = useState("")
  const [nestedSubmitting, setNestedSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const res = await fetch(`/api/community/${params.id}`, { cache: "no-store" })
        if (!res.ok) throw new Error(`Failed: ${res.status}`)
        const data = await res.json()
        if (!cancelled) setPost(data.post)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (params.id) load()
    return () => { cancelled = true }
  }, [params.id])

  async function submitReply() {
    if (!replyContent.trim()) return
    try {
      setSubmitting(true)
      const res = await fetch(`/api/community/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: params.id, content: replyContent.trim() })
      })
      if (res.ok) {
        const { reply } = await res.json()
        setPost((prev: any) => ({ ...prev, repliesList: [...prev.repliesList, reply] }))
        setReplyContent("")
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function submitNestedReply(replyToId: string) {
    if (!nestedReplyContent.trim()) return
    try {
      setNestedSubmitting(true)
      const res = await fetch(`/api/community/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          postId: params.id, 
          content: nestedReplyContent.trim(),
          replyToId: replyToId
        })
      })
      if (res.ok) {
        const { reply } = await res.json()
        // Update the specific reply with the new nested reply
        setPost((prev: any) => ({
          ...prev,
          repliesList: prev.repliesList.map((r: any) => 
            r.id === replyToId 
              ? { ...r, replies: [...(r.replies || []), reply] }
              : r
          )
        }))
        setNestedReplyContent("")
        setReplyingTo(null)
      }
    } finally {
      setNestedSubmitting(false)
    }
  }

  async function toggleReplyLike(replyId: string, currentLikes: number) {
    try {
      const res = await fetch("/api/community/reply-like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyId }),
      })
      
      if (res.ok) {
        const { liked } = await res.json()
        setPost((prev: any) => ({
          ...prev,
          repliesList: prev.repliesList.map((reply: any) => {
            if (reply.id === replyId) {
              return {
                ...reply,
                likes: liked ? currentLikes + 1 : Math.max(0, currentLikes - 1),
                isLiked: liked,
              }
            }
            // Check nested replies
            if (reply.replies) {
              const updatedReplies = reply.replies.map((nestedReply: any) => {
                if (nestedReply.id === replyId) {
                  return {
                    ...nestedReply,
                    likes: liked ? currentLikes + 1 : Math.max(0, currentLikes - 1),
                    isLiked: liked,
                  }
                }
                return nestedReply
              })
              return { ...reply, replies: updatedReplies }
            }
            return reply
          })
        }))
      }
    } catch (error) {
      console.error("Failed to toggle reply like:", error)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }
  if (!post) {
    return <div className="min-h-screen flex items-center justify-center">Not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{post.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.authorAvatar || "/placeholder.svg"} />
                <AvatarFallback>
                  {post.author.split(" ").map((n: string) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium">{post.author}</div>
                <div className="text-xs text-gray-500">{post.category} • {post.crop}</div>
              </div>
            </div>
            <div
              className="text-gray-700 prose prose-sm sm:prose max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content || "") }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Replies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {post.repliesList?.length ? post.repliesList.map((r: any) => (
              <div key={r.id} className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={r.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {r.author.split(" ").map((n: string) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {r.author}{r.isExpert && <span className="ml-2 text-xs text-green-700">(Expert)</span>}
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">{r.content}</div>
                    <div className="flex items-center space-x-4 mt-2">
                      <button
                        onClick={() => toggleReplyLike(r.id, r.likes || 0)}
                        className="flex items-center text-sm text-gray-500 hover:text-green-600 transition-colors"
                      >
                        <svg className={`h-4 w-4 mr-1 ${r.isLiked ? 'text-green-600 fill-current' : ''}`} viewBox="0 0 20 20">
                          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                        </svg>
                        {r.likes || 0}
                      </button>
                      <button
                        onClick={() => setReplyingTo(r.id)}
                        className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>

                {/* Nested Replies */}
                {r.replies && r.replies.length > 0 && (
                  <div className="ml-8 space-y-3">
                    {r.replies.map((nestedReply: any) => (
                      <div key={nestedReply.id} className="flex items-start space-x-3 border-l-2 border-gray-200 pl-4">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={nestedReply.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {nestedReply.author.split(" ").map((n: string) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {nestedReply.author}{nestedReply.isExpert && <span className="ml-2 text-xs text-green-700">(Expert)</span>}
                          </div>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap">{nestedReply.content}</div>
                          <div className="flex items-center space-x-4 mt-2">
                            <button
                              onClick={() => toggleReplyLike(nestedReply.id, nestedReply.likes || 0)}
                              className="flex items-center text-sm text-gray-500 hover:text-green-600 transition-colors"
                            >
                              <svg className={`h-4 w-4 mr-1 ${nestedReply.isLiked ? 'text-green-600 fill-current' : ''}`} viewBox="0 0 20 20">
                                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                              </svg>
                              {nestedReply.likes || 0}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Nested Reply Form */}
                {replyingTo === r.id && (
                  <div className="ml-8 border-l-2 border-gray-200 pl-4">
                    <Textarea
                      placeholder="Write a reply..."
                      value={nestedReplyContent}
                      onChange={(e) => setNestedReplyContent(e.target.value)}
                      rows={2}
                      className="mb-2"
                    />
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => submitNestedReply(r.id)} 
                        disabled={nestedSubmitting || !nestedReplyContent.trim()}
                      >
                        {nestedSubmitting ? 'Posting...' : 'Post Reply'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setReplyingTo(null)
                          setNestedReplyContent("")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )) : (
              <div className="text-sm text-gray-500">No replies yet.</div>
            )}

            <div className="pt-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={3}
              />
              <Button className="mt-2" onClick={submitReply} disabled={submitting || !replyContent.trim()}>
                {submitting ? 'Posting...' : 'Post Reply'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


