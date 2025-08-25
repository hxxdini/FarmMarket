"use client"

import { useEffect, useState } from "react"
import DOMPurify from "dompurify"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { useSession } from "next-auth/react"
import { Edit2, Trash2, X, Check, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function CommunityPostDetailPage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [post, setPost] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [nestedReplyContent, setNestedReplyContent] = useState("")
  const [nestedSubmitting, setNestedSubmitting] = useState(false)

  // Edit states
  const [editingPost, setEditingPost] = useState(false)
  const [editingReply, setEditingReply] = useState<string | null>(null)
  const [editingNestedReply, setEditingNestedReply] = useState<string | null>(null)
  const [editPostTitle, setEditPostTitle] = useState("")
  const [editPostContent, setEditPostContent] = useState("")
  const [editPostCategory, setEditPostCategory] = useState("")
  const [editPostCrop, setEditPostCrop] = useState("")
  const [editReplyContent, setEditReplyContent] = useState("")
  const [editNestedReplyContent, setEditNestedReplyContent] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [editingPostLoading, setEditingPostLoading] = useState(false)
  const [editingReplyLoading, setEditingReplyLoading] = useState<string | null>(null)
  const [editingNestedReplyLoading, setEditingNestedReplyLoading] = useState<string | null>(null)
  const [deletingReply, setDeletingReply] = useState<string | null>(null)
  const [deletingNestedReply, setDeletingNestedReply] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const res = await fetch(`/api/community/${params.id}`, { cache: "no-store" })
        if (!res.ok) throw new Error(`Failed: ${res.status}`)
        const data = await res.json()
        if (!cancelled) {
          setPost(data.post)
          setEditPostTitle(data.post.title)
          setEditPostContent(data.post.content)
          setEditPostCategory(data.post.category)
          setEditPostCrop(data.post.crop)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (params.id) load()
    return () => { cancelled = true }
  }, [params.id])

  async function submitReply() {
    if (!replyContent.trim() || replyContent === '<p></p>') return
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
        toast({
          title: "Reply posted!",
          description: "Your reply has been posted.",
        })
      } else {
        throw new Error(`Failed to post reply: ${res.status}`)
      }
         } catch (error: any) {
       console.error("Failed to submit reply:", error)
       toast({
         title: "Error posting reply",
         description: error?.message || "An error occurred",
         variant: "destructive",
       })
    } finally {
      setSubmitting(false)
    }
  }

  async function submitNestedReply(replyToId: string) {
    if (!nestedReplyContent.trim() || nestedReplyContent === '<p></p>') return
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
        toast({
          title: "Nested reply posted!",
          description: "Your nested reply has been posted.",
        })
      } else {
        throw new Error(`Failed to post nested reply: ${res.status}`)
      }
         } catch (error: any) {
       console.error("Failed to submit nested reply:", error)
       toast({
         title: "Error posting nested reply",
         description: error?.message || "An error occurred",
         variant: "destructive",
       })
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
      } else {
        throw new Error(`Failed to toggle reply like: ${res.status}`)
      }
    } catch (error: any) {
      console.error("Failed to toggle reply like:", error)
      toast({
        title: "Error liking reply",
        description: error?.message || "An error occurred",
        variant: "destructive",
      })
    }
  }

  // Post editing functions
  async function handleEditPost() {
    try {
      setEditingPostLoading(true)
      const res = await fetch(`/api/community/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editPostTitle,
          content: editPostContent,
          category: editPostCategory,
          crop: editPostCrop
        })
      })
      
      if (res.ok) {
        const { post: updatedPost } = await res.json()
        setPost((prev: any) => ({
          ...prev,
          title: updatedPost.title,
          content: updatedPost.content,
          category: updatedPost.category,
          crop: updatedPost.crop
        }))
        setEditingPost(false)
        toast({
          title: "Post updated!",
          description: "Your post has been updated.",
        })
      } else {
        throw new Error(`Failed to edit post: ${res.status}`)
      }
    } catch (error: any) {
      console.error("Failed to edit post:", error)
      toast({
        title: "Error updating post",
        description: error?.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setEditingPostLoading(false)
    }
  }

  async function handleDeletePost() {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return
    }
    
    try {
      setDeleting(true)
      const res = await fetch(`/api/community/${params.id}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        router.push('/community')
        toast({
          title: "Post deleted!",
          description: "Your post has been deleted.",
        })
      } else {
        throw new Error(`Failed to delete post: ${res.status}`)
      }
    } catch (error: any) {
      console.error("Failed to delete post:", error)
      toast({
        title: "Error deleting post",
        description: error?.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  // Reply editing functions
  async function handleEditReply(replyId: string) {
    try {
      setEditingReplyLoading(replyId)
      const res = await fetch(`/api/community/replies/${replyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editReplyContent })
      })
      
      if (res.ok) {
        const { reply: updatedReply } = await res.json()
        setPost((prev: any) => ({
          ...prev,
          repliesList: prev.repliesList.map((r: any) => 
            r.id === replyId ? { ...r, content: updatedReply.content } : r
          )
        }))
        setEditingReply(null)
        setEditReplyContent("")
        toast({
          title: "Reply updated!",
          description: "Your reply has been updated.",
        })
      } else {
        throw new Error(`Failed to edit reply: ${res.status}`)
      }
    } catch (error: any) {
      console.error("Failed to edit reply:", error)
      toast({
        title: "Error updating reply",
        description: error?.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setEditingReplyLoading(null)
    }
  }

  async function handleDeleteReply(replyId: string) {
    if (!confirm("Are you sure you want to delete this reply?")) {
      return
    }
    
    try {
      setDeletingReply(replyId)
      const res = await fetch(`/api/community/replies/${replyId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        setPost((prev: any) => ({
          ...prev,
          repliesList: prev.repliesList.filter((r: any) => r.id !== replyId)
        }))
        toast({
          title: "Reply deleted!",
          description: "Your reply has been deleted.",
        })
      } else {
        throw new Error(`Failed to delete reply: ${res.status}`)
      }
    } catch (error: any) {
      console.error("Failed to delete reply:", error)
      toast({
        title: "Error deleting reply",
        description: error?.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setDeletingReply(null)
    }
  }

  // Nested reply editing functions
  async function handleEditNestedReply(replyId: string) {
    try {
      setEditingNestedReplyLoading(replyId)
      const res = await fetch(`/api/community/replies/${replyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editNestedReplyContent })
      })
      
      if (res.ok) {
        const { reply: updatedReply } = await res.json()
        setPost((prev: any) => ({
          ...prev,
          repliesList: prev.repliesList.map((r: any) => {
            if (r.replies) {
              const updatedReplies = r.replies.map((nr: any) => 
                nr.id === replyId ? { ...nr, content: updatedReply.content } : nr
              )
              return { ...r, replies: updatedReplies }
            }
            return r
          })
        }))
        setEditingNestedReply(null)
        setEditNestedReplyContent("")
        toast({
          title: "Nested reply updated!",
          description: "Your nested reply has been updated.",
        })
      } else {
        throw new Error(`Failed to edit nested reply: ${res.status}`)
      }
    } catch (error: any) {
      console.error("Failed to edit nested reply:", error)
      toast({
        title: "Error updating nested reply",
        description: error?.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setEditingNestedReplyLoading(null)
    }
  }

  async function handleDeleteNestedReply(replyId: string) {
    if (!confirm("Are you sure you want to delete this reply?")) {
      return
    }
    
    try {
      setDeletingNestedReply(replyId)
      const res = await fetch(`/api/community/replies/${replyId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        setPost((prev: any) => ({
          ...prev,
          repliesList: prev.repliesList.map((r: any) => {
            if (r.replies) {
              const updatedReplies = r.replies.filter((nr: any) => nr.id !== replyId)
              return { ...r, replies: updatedReplies }
            }
            return r
          })
        }))
        toast({
          title: "Nested reply deleted!",
          description: "Your nested reply has been deleted.",
        })
      } else {
        throw new Error(`Failed to delete nested reply: ${res.status}`)
      }
    } catch (error: any) {
      console.error("Failed to delete nested reply:", error)
      toast({
        title: "Error deleting nested reply",
        description: error?.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setDeletingNestedReply(null)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }
  if (!post) {
    return <div className="min-h-screen flex items-center justify-center">Not found</div>
  }

  const isAuthor = post.currentUserId && post.authorId === post.currentUserId

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              {editingPost ? (
                <div className="flex-1 space-y-4">
                  <Input
                    value={editPostTitle}
                    onChange={(e) => setEditPostTitle(e.target.value)}
                    className="text-2xl font-semibold"
                  />
                  <div className="flex space-x-3">
                    <select
                      value={editPostCategory}
                      onChange={(e) => setEditPostCategory(e.target.value)}
                      className="p-3 border rounded-md text-sm"
                    >
                      <option value="Planting">Planting</option>
                      <option value="Pest Control">Pest Control</option>
                      <option value="Disease Management">Disease Management</option>
                      <option value="Harvesting">Harvesting</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Weather">Weather</option>
                    </select>
                    <Input
                      value={editPostCrop}
                      onChange={(e) => setEditPostCrop(e.target.value)}
                      placeholder="Crop type"
                      className="text-sm p-3"
                    />
                  </div>
                </div>
              ) : (
                <CardTitle className="text-2xl leading-tight">{post.title}</CardTitle>
              )}
              
              {isAuthor && (
                <div className="flex items-center space-x-2">
                  {editingPost ? (
                    <>
                      <Button size="sm" onClick={handleEditPost} disabled={editingPostLoading}>
                        {editingPostLoading ? 'Saving...' : <Check className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingPost(false)} disabled={editingPostLoading}>
                        {editingPostLoading ? 'Cancelling...' : <X className="h-4 w-4" />}
                      </Button>
                    </>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setEditingPost(true)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Post
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDeletePost} className="text-red-600" disabled={deleting}>
                          {deleting ? 'Deleting...' : <Trash2 className="h-4 w-4 mr-2" />}
                          Delete Post
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center space-x-4 mb-6 pb-4 border-b border-gray-100">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.authorAvatar || "/placeholder.svg"} />
                <AvatarFallback>
                  {post.author.split(" ").map((n: string) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium text-gray-900">{post.author}</div>
                <div className="text-xs text-gray-500">{post.category} • {post.crop}</div>
              </div>
            </div>
            
            {editingPost ? (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Post Content</h3>
                  <RichTextEditor
                    value={editPostContent}
                    onChange={setEditPostContent}
                    placeholder="Write your post content here..."
                  />
                </div>
              </div>
            ) : (
              <div
                className="text-gray-800 prose prose-lg sm:prose-xl max-w-none leading-relaxed"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content || "") }}
              />
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl">Replies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-0">
            {post.repliesList?.length ? post.repliesList.map((r: any) => (
              <div key={r.id} className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={r.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {r.author.split(" ").map((n: string) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        {r.author}{r.isExpert && <span className="ml-2 text-xs text-green-700">(Expert)</span>}
                      </div>
                      
                      {post.currentUserId === r.authorId && (
                        <div className="flex items-center space-x-2">
                          {editingReply === r.id ? (
                            <>
                              <Button size="sm" onClick={() => handleEditReply(r.id)} disabled={editingReplyLoading === r.id}>
                                {editingReplyLoading === r.id ? 'Saving...' : <Check className="h-3 w-3" />}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                setEditingReply(null)
                                setEditReplyContent("")
                              }} disabled={editingReplyLoading === r.id}>
                                {editingReplyLoading === r.id ? 'Cancelling...' : <X className="h-3 w-3" />}
                              </Button>
                            </>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => {
                                  setEditingReply(r.id)
                                  setEditReplyContent(r.content)
                                }}>
                                  <Edit2 className="h-3 w-3 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteReply(r.id)} className="text-red-600" disabled={deletingReply === r.id}>
                                  {deletingReply === r.id ? 'Deleting...' : <Trash2 className="h-3 w-3 mr-2" />}
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {editingReply === r.id ? (
                      <div className="mt-3">
                        <RichTextEditor
                          value={editReplyContent}
                          onChange={setEditReplyContent}
                          placeholder="Edit your reply..."
                        />
                      </div>
                    ) : (
                      <div 
                        className="text-sm text-gray-700 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(r.content || "") }}
                      />
                    )}
                    
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
                  <div className="ml-8 space-y-4 mt-4">
                    {r.replies.map((nestedReply: any) => (
                      <div key={nestedReply.id} className="flex items-start space-x-3 border-l-2 border-gray-300 pl-4 py-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={nestedReply.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {nestedReply.author.split(" ").map((n: string) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">
                              {nestedReply.author}{nestedReply.isExpert && <span className="ml-2 text-xs text-green-700">(Expert)</span>}
                            </div>
                            
                            {post.currentUserId === nestedReply.authorId && (
                              <div className="flex items-center space-x-2">
                                {editingNestedReply === nestedReply.id ? (
                                  <>
                                    <Button size="sm" onClick={() => handleEditNestedReply(nestedReply.id)} disabled={editingNestedReplyLoading === nestedReply.id}>
                                      {editingNestedReplyLoading === nestedReply.id ? 'Saving...' : <Check className="h-3 w-3" />}
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => {
                                      setEditingNestedReply(null)
                                      setEditNestedReplyContent("")
                                    }} disabled={editingNestedReplyLoading === nestedReply.id}>
                                      {editingNestedReplyLoading === nestedReply.id ? 'Cancelling...' : <X className="h-3 w-3" />}
                                    </Button>
                                  </>
                                ) : (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuItem onClick={() => {
                                        setEditingNestedReply(nestedReply.id)
                                        setEditNestedReplyContent(nestedReply.content)
                                      }}>
                                        <Edit2 className="h-3 w-3 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDeleteNestedReply(nestedReply.id)} className="text-red-600" disabled={deletingNestedReply === nestedReply.id}>
                                        {deletingNestedReply === nestedReply.id ? 'Deleting...' : <Trash2 className="h-3 w-3 mr-2" />}
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {editingNestedReply === nestedReply.id ? (
                            <div className="mt-3">
                              <RichTextEditor
                                value={editNestedReplyContent}
                                onChange={setEditNestedReplyContent}
                                placeholder="Edit your reply..."
                              />
                            </div>
                          ) : (
                            <div 
                              className="text-sm text-gray-700 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(nestedReply.content || "") }}
                            />
                          )}
                          
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
                  <div className="ml-8 border-l-2 border-gray-300 pl-4 mt-3">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Write a Nested Reply</h4>
                      <RichTextEditor
                        value={nestedReplyContent}
                        onChange={setNestedReplyContent}
                        placeholder="Write your nested reply here..."
                      />
                      <div className="flex space-x-3">
                        <Button 
                          size="sm" 
                          onClick={() => submitNestedReply(r.id)} 
                          disabled={nestedSubmitting || !nestedReplyContent.trim() || nestedReplyContent === '<p></p>'}
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
                  </div>
                )}
              </div>
            )) : (
              <div className="text-sm text-gray-500">No replies yet.</div>
            )}

            <div className="pt-4 border-t border-gray-100">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">Write a Reply</h3>
                <RichTextEditor
                  value={replyContent}
                  onChange={setReplyContent}
                  placeholder="Write your reply here..."
                />
                <Button 
                  className="px-6" 
                  onClick={submitReply} 
                  disabled={submitting || !replyContent.trim() || replyContent === '<p></p>'}
                >
                  {submitting ? 'Posting...' : 'Post Reply'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Toaster />
    </div>
  )
}


