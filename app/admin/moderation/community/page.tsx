"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, CheckCircle, XCircle, Shield, Search } from 'lucide-react'

export default function CommunityModerationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [filtering, setFiltering] = useState(false)
  const [posts, setPosts] = useState<any[]>([])
  const [filters, setFilters] = useState({ status: 'pending', search: '' })
  const [moderating, setModerating] = useState<string | null>(null)

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

  async function handleModerate(id: string, action: 'approve' | 'reject') {
    try {
      setModerating(id)
      const res = await fetch(`/api/admin/moderation/community/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== id))
      }
    } finally {
      setModerating(null)
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
            <h1 className="text-2xl font-bold">Community Moderation</h1>
            <p className="text-gray-600">Approve or reject community posts</p>
          </div>
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <Shield className="h-4 w-4 mr-1" /> {posts.length} Pending
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
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="all">All</option>
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
          {posts.map((p) => (
            <Card key={p.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="outline">{p.category}</Badge>
                      <Badge variant="secondary">{p.crop}</Badge>
                      <Badge className="bg-gray-100 text-gray-800">{p.type}</Badge>
                    </div>
                    <div className="text-base font-semibold mb-1">{p.title}</div>
                    <div className="text-sm text-gray-700 line-clamp-2">{p.content}</div>
                  </div>
                  <div className="w-64">
                    <div className="flex items-center space-x-2 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={p.author.avatar} />
                        <AvatarFallback>{(p.author.name || 'U').split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{p.author.name}</div>
                        <div className="text-xs text-gray-500">{p.author.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleModerate(p.id, 'approve')} disabled={moderating === p.id}>
                        {moderating === p.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />} Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => handleModerate(p.id, 'reject')} disabled={moderating === p.id}>
                        {moderating === p.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <XCircle className="h-3 w-3 mr-1" />} Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}


