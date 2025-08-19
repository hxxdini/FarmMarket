"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, CheckCircle, XCircle, Shield, Search, AlertTriangle, Eye } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function CommunityModerationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [filtering, setFiltering] = useState(false)
  const [posts, setPosts] = useState<any[]>([])
  const [filters, setFilters] = useState({ status: 'pending', search: '' })
  const [moderating, setModerating] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
    } else if (status === 'authenticated') {
      const role = (session?.user as any)?.role
      if (role !== 'admin' && role !== 'superadmin') {
        router.replace('/')
        return
      }
      fetchPosts()
    }
  }, [status, session, router, filters.status])

  useEffect(() => {
    const id = setTimeout(() => {
      if (status === 'authenticated') {
        setFiltering(true)
        fetchPosts()
      }
    }, 300)
    return () => clearTimeout(id)
  }, [filters.search])

  async function fetchPosts() {
    try {
      if (!filtering) setLoading(true)
      const params = new URLSearchParams({ status: filters.status, search: filters.search })
      const res = await fetch(`/api/admin/moderation/community?${params.toString()}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setPosts(data.posts)
    } catch (e) {
      // noop
    } finally {
      setLoading(false)
      setFiltering(false)
    }
  }

  async function handleModerate(id: string, action: 'approve' | 'reject', reason?: string) {
    try {
      setModerating(id)
      const res = await fetch(`/api/admin/moderation/community/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason })
      })
      if (res.ok) {
        // Remove the moderated post from the list
        setPosts(prev => prev.filter(p => p.id !== id))
        // Reset rejection dialog
        setShowRejectDialog(null)
        setRejectReason('')
      }
    } finally {
      setModerating(null)
    }
  }

  const handleReject = (id: string) => {
    if (rejectReason.trim()) {
      handleModerate(id, 'reject', rejectReason.trim())
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        )
    }
  }

  const getStatusCount = () => {
    switch (filters.status) {
      case 'pending':
        return `${posts.length} Pending`
      case 'approved':
        return `${posts.length} Approved`
      case 'rejected':
        return `${posts.length} Rejected`
      case 'all':
        return `${posts.length} Total`
      default:
        return `${posts.length} Posts`
    }
  }

  const getStatusColor = () => {
    switch (filters.status) {
      case 'pending':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2"><Loader2 className="h-6 w-6 animate-spin" /><span>Loading community moderation...</span></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {filters.status === 'pending' ? 'Community Moderation' :
               filters.status === 'approved' ? 'Approved Posts' :
               filters.status === 'rejected' ? 'Rejected Posts' :
               'All Community Posts'}
            </h1>
            <p className="text-gray-600">
              {filters.status === 'pending' ? 'Approve or reject community posts' :
               filters.status === 'approved' ? 'View approved community posts' :
               filters.status === 'rejected' ? 'View rejected community posts' :
               'View and manage all community posts'}
            </p>
          </div>
          <Badge variant="outline" className={getStatusColor()}>
            <Shield className="h-4 w-4 mr-1" /> {getStatusCount()}
          </Badge>
        </div>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
            <CardDescription>Filter posts by status and content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">Status</label>
                <select className="w-full p-2 border rounded-md" value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}>
                  <option value="pending">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="all">All Posts</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} placeholder="Search posts..." className="pl-10" />
                  {filtering && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {posts.length === 0 ? (
            <Card className="text-center py-12">
              {filters.status === 'pending' ? (
                <>
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending posts</h3>
                  <p className="text-gray-500">All posts have been processed. Great job!</p>
                </>
              ) : filters.status === 'approved' ? (
                <>
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No approved posts</h3>
                  <p className="text-gray-500">No posts have been approved yet.</p>
                </>
              ) : filters.status === 'rejected' ? (
                <>
                  <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No rejected posts</h3>
                  <p className="text-gray-500">No posts have been rejected yet.</p>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
                  <p className="text-gray-500">No posts match the current filters.</p>
                </>
              )}
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Author
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Post Content
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category & Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {posts.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={p.author.avatar} alt={p.author.name} />
                              <AvatarFallback className="text-xs">
                                {(p.author.name || 'U').split(' ').map((n: string) => n.charAt(0)).join('').substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{p.author.name}</div>
                              <div className="text-xs text-gray-500">{p.author.email}</div>
                              <div className="text-xs text-gray-400">
                                {new Date(p.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-4 py-3">
                          <div className="max-w-[300px]">
                            <div className="text-sm font-medium text-gray-900 mb-1">{p.title}</div>
                            <div className="text-xs text-gray-600 line-clamp-2">{p.content}</div>
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">{p.category}</Badge>
                              <Badge variant="secondary" className="text-xs">{p.crop}</Badge>
                            </div>
                            <Badge className="bg-gray-100 text-gray-800 text-xs">{p.type}</Badge>
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getStatusBadge(p.status)}
                        </td>
                        
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {/* Only show moderation actions for pending posts */}
                            {p.status.toLowerCase() === 'pending' ? (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-xs h-7 px-2"
                                  onClick={() => handleModerate(p.id, 'approve')}
                                  disabled={moderating === p.id}
                                >
                                  {moderating === p.id ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                  )}
                                  Approve
                                </Button>
                                
                                <Dialog open={showRejectDialog === p.id} onOpenChange={(open) => !open && setShowRejectDialog(null)}>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 border-red-300 hover:bg-red-50 text-xs h-7 px-2"
                                      onClick={() => setShowRejectDialog(p.id)}
                                      disabled={moderating === p.id}
                                    >
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Reject
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Reject Post</DialogTitle>
                                      <DialogDescription>
                                        Please provide a reason for rejecting this post. This will help the author understand why their content was not approved.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="reject-reason">Reason for rejection</Label>
                                        <textarea
                                          id="reject-reason"
                                          className="w-full p-2 border rounded-md mt-1"
                                          rows={3}
                                          placeholder="Enter rejection reason..."
                                          value={rejectReason}
                                          onChange={(e) => setRejectReason(e.target.value)}
                                        />
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setShowRejectDialog(null)
                                          setRejectReason('')
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleReject(p.id)}
                                        disabled={!rejectReason.trim() || moderating === p.id}
                                      >
                                        {moderating === p.id ? (
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                          <XCircle className="h-4 w-4 mr-2" />
                                        )}
                                        Reject Post
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </>
                            ) : (
                              <div className="text-sm text-gray-500">
                                {p.status.toLowerCase() === 'approved' ? 'Post has been approved' : 'Post has been rejected'}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}


