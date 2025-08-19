"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import Link from "next/link"

// replaced SimpleEditor with a full-featured TipTap editor (see components/ui/rich-text-editor)

export default function WriteKnowledgeArticlePage() {
  const { status } = useSession()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [crop, setCrop] = useState("")
  const [content, setContent] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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

  async function submitArticle() {
    setError(null)
    if (!title || !category || !content) return
    try {
      setSubmitting(true)
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, crop: crop || undefined, content, type: "advice" }),
      })
      if (res.status === 403) {
        const data = await res.json()
        setError(data?.error || "Only verified experts can publish articles")
        return
      }
      if (!res.ok) throw new Error("Failed to submit")
      const { discussion } = await res.json()
      router.replace(`/community/knowledge/${discussion.id}`)
    } catch (e: any) {
      setError(e?.message || "Submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/community/knowledge">← Back to Knowledge</Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Write Expert Article</CardTitle>
            <CardDescription>Long-form, in-depth guidance for farmers. Articles are reviewed before publishing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input placeholder="E.g., Integrated pest management for maize" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <select className="w-full p-2 border rounded-md" value={category} onChange={(e) => setCategory(e.target.value)}>
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
              <label className="text-sm font-medium mb-2 block">Topic (optional)</label>
              <Input placeholder="E.g., Maize, Goats, Poultry, Soil Health" value={crop} onChange={(e) => setCrop(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Article Content</label>
              <RichTextEditor value={content} onChange={setContent} placeholder="Write your article..." />
              <div className="text-xs text-gray-500 mt-1">Tip: Aim for at least 400 words for publication.</div>
            </div>
            <Button className="w-full" onClick={submitArticle} disabled={!title || !category || !content || submitting}>
              {submitting ? "Submitting..." : "Submit for Review"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


