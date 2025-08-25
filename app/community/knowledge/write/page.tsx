"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { canPostKnowledgeContent, getUserTypeLabel } from "@/lib/utils"

// replaced SimpleEditor with a full-featured TipTap editor (see components/ui/rich-text-editor)

export default function WriteKnowledgeArticlePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [crop, setCrop] = useState("")
  const [content, setContent] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [userType, setUserType] = useState<string>("")
  const [canPost, setCanPost] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [status, router])

  useEffect(() => {
    async function fetchUserProfile() {
      if (status === "authenticated" && session?.user?.email) {
        try {
          const response = await fetch('/api/users/profile')
          if (response.ok) {
            const userData = await response.json()
            const expertProfile = userData.expertProfile
            const canPostContent = canPostKnowledgeContent((session.user as any).role, expertProfile)
            const userTypeLabel = getUserTypeLabel((session.user as any).role, expertProfile)
            
            console.log('Debug permissions:', {
              userRole: (session.user as any).role,
              expertProfile,
              canPostContent,
              userTypeLabel
            })
            
            console.log('Setting state - canPost:', canPostContent, 'userType:', userTypeLabel)
            setCanPost(canPostContent)
            setUserType(userTypeLabel)
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
        }
      }
    }

    fetchUserProfile()
  }, [status, session])

  // Debug effect to monitor state changes
  useEffect(() => {
    console.log('State changed - canPost:', canPost, 'userType:', userType)
  }, [canPost, userType])

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
        setError(data?.error || "Only administrators, verified experts, and extension officers can publish articles")
        return
      }
      if (!res.ok) throw new Error("Failed to submit")
      const { discussion, message } = await res.json()
      
      // Show success message before redirecting
      if (message) {
        // You could use a toast notification here instead
        alert(message)
      }
      
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Write Knowledge Article</CardTitle>
                <CardDescription>Long-form, in-depth guidance for farmers. Articles are reviewed before publishing. Available to administrators, verified experts, and extension officers.</CardDescription>
              </div>
              {userType && (
                <Badge variant={canPost ? "default" : "secondary"}>
                  {userType}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <div className="text-sm text-red-600">{error}</div>}
            
            {!canPost && userType && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="text-sm text-yellow-800">
                  <strong>Permission Required:</strong> Only administrators, verified experts, and extension officers can publish knowledge articles. 
                  {userType === 'Farmer' && (
                    <span> If you're an expert or extension officer, please contact support to get your account verified.</span>
                  )}
                </div>
              </div>
            )}
            
            {canPost && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="text-sm text-green-800">
                  <strong>✓ You can publish knowledge articles!</strong> As a {userType}, you have permission to create and submit knowledge content.
                  {userType === 'Administrator' && ' Your articles will be published immediately.'}
                  {(userType === 'Expert' || userType === 'Extension Officer') && ' Your articles will be reviewed for accuracy and compliance before publishing.'}
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input 
                placeholder="E.g., Integrated pest management for maize" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                disabled={!canPost}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <select 
                className="w-full p-2 border rounded-md" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                disabled={!canPost}
              >
                <option value="">Select category</option>
                <option value="Planting">Planting</option>
                <option value="Pest Control">Pest Control</option>
                <option value="Disease Management">Disease Management</option>
                <option value="Harvesting">Harvesting</option>
                <option value="Marketing">Marketing</option>
                <option value="Weather">Weather</option>
                <option value="Soil Health">Soil Health</option>
                <option value="Irrigation">Irrigation</option>
                <option value="Fertilization">Fertilization</option>
                <option value="Crop Rotation">Crop Rotation</option>
                <option value="Organic Farming">Organic Farming</option>
                <option value="Technology">Technology</option>
                <option value="Financial Management">Financial Management</option>
                <option value="Policy & Regulations">Policy & Regulations</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Topic (optional)</label>
              <Input 
                placeholder="E.g., Maize, Goats, Poultry, Soil Health" 
                value={crop} 
                onChange={(e) => setCrop(e.target.value)}
                disabled={!canPost}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Article Content</label>
                             <RichTextEditor 
                 key={`editor-${canPost}`}
                 value={content} 
                 onChange={setContent} 
                 placeholder="Write your article..." 
                 disabled={!canPost}
               />
              <div className="text-xs text-gray-500 mt-1">
                Tip: Aim for at least 400 words for publication. 
                {userType === 'Administrator' && ' As an administrator, your articles will be published immediately.'}
                {userType === 'Expert' && ' As a verified expert, your articles will be reviewed for accuracy and relevance.'}
                {userType === 'Extension Officer' && ' As an extension officer, your articles will be reviewed for policy compliance and accuracy.'}
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={submitArticle} 
              disabled={!canPost || !title || !category || !content || submitting}
            >
              {submitting ? "Submitting..." : canPost ? "Submit for Review" : "Permission Required"}
            </Button>
          </CardContent>
        </Card>
        
        {canPost && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Content Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">For All Articles:</h4>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Provide practical, actionable advice</li>
                    <li>Include relevant examples and case studies</li>
                    <li>Use clear, farmer-friendly language</li>
                    <li>Reference reliable sources when possible</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">For Extension Officers:</h4>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Ensure policy compliance</li>
                    <li>Include regulatory requirements</li>
                    <li>Reference official guidelines</li>
                    <li>Provide contact information for support</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}


