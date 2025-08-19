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
              <div key={r.id} className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={r.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {r.author.split(" ").map((n: string) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium">
                    {r.author}{r.isExpert && <span className="ml-2 text-xs text-green-700">(Expert)</span>}
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{r.content}</div>
                </div>
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


