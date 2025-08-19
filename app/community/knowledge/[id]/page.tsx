"use client"

import { useEffect, useMemo, useState } from "react"
import DOMPurify from "dompurify"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function KnowledgeArticleDetailPage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const [post, setPost] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const res = await fetch(`/api/community/${params.id}`, { cache: "no-store" })
        if (!res.ok) throw new Error(`Failed: ${res.status}`)
        const data = await res.json()
        // Only allow viewing expert advice here; redirect others to community post detail
        if (data?.post?.type !== "advice") {
          router.replace(`/community/${params.id}`)
          return
        }
        if (!cancelled) setPost(data.post)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (params.id) load()
    return () => { cancelled = true }
  }, [params.id, router])

  const readTime = useMemo(() => {
    if (!post?.content) return 0
    const words = post.content.trim().split(/\s+/).length
    return Math.max(1, Math.round(words / 200))
  }, [post?.content])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }
  if (!post) {
    return <div className="min-h-screen flex items-center justify-center">Not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/community/knowledge">← Back to Knowledge</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="outline">{post.category}</Badge>
              {post.crop ? (
                <Badge variant="secondary">{post.crop}</Badge>
              ) : null}
              <span className="text-xs text-gray-500">{readTime} min read</span>
            </div>
            <CardTitle className="text-2xl leading-snug">{post.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3 mb-6">
              <Avatar className="h-9 w-9">
                <AvatarImage src={post.authorAvatar || "/placeholder.svg"} />
                <AvatarFallback>
                  {post.author.split(" ").map((n: string) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium">{post.author}</div>
                <div className="text-xs text-gray-500">Expert Article</div>
              </div>
            </div>

            <article className="prose prose-sm sm:prose max-w-none text-gray-800">
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content || "") }} />
            </article>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


