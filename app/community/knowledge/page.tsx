"use client"

import { useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { canPostKnowledgeContent, getUserTypeLabel } from '@/lib/utils'

export default function KnowledgeRepositoryPage() {
  const { data: session, status } = useSession()
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [canPost, setCanPost] = useState(false)
  const [userType, setUserType] = useState<string>("")

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        // Only show expert advice, exclude quick tips and success stories
        const res = await fetch(`/api/community?type=advice&q=${encodeURIComponent(search)}`)
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        const adviceOnly = (data.discussions || [])
          // Prefer long-form, blog-like items
          .filter((d: any) => (d?.content?.length || 0) >= 400)
        if (!cancelled) setItems(adviceOnly)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    const id = setTimeout(load, 300)
    return () => { cancelled = true; clearTimeout(id) }
  }, [search])

  useEffect(() => {
    let cancelled = false
    async function loadProfile() {
      try {
        if (status !== 'authenticated') return
        const res = await fetch('/api/users/profile', { cache: 'no-store' })
        if (res.ok) {
          const userData = await res.json()
          const expertProfile = userData.expertProfile
          const canPostContent = canPostKnowledgeContent(session?.user?.role, expertProfile)
          const userTypeLabel = getUserTypeLabel(session?.user?.role, expertProfile)
          
          if (!cancelled) {
            setCanPost(canPostContent)
            setUserType(userTypeLabel)
          }
        }
      } catch {}
    }
    loadProfile()
    return () => { cancelled = true }
  }, [status, session])

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Knowledge Repository</h1>
          <div className="flex items-center gap-3">
            <Input placeholder="Search articles..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
            {canPost && (
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/community/knowledge/write">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Write Article
                </Link>
              </Button>
            )}
          </div>
        </div>
        
        {canPost && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-green-800">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><strong>You can contribute!</strong> As a {userType}, you have permission to write and publish knowledge articles.</span>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          {loading ? (
            <Card><CardContent className="py-6">Loading...</CardContent></Card>
          ) : items.length ? items.map((item: any) => (
            <Link key={item.id} href={`/community/knowledge/${item.id}`}>
            <Card className="hover:shadow-sm cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{item.category}</Badge>
                  {item.crop ? (
                    <Badge variant="secondary">{item.crop}</Badge>
                  ) : null}
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="text-gray-700 line-clamp-4"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.content || '') }}
                />
              </CardContent>
            </Card>
            </Link>
          )) : (
            <Card><CardContent className="py-6 text-gray-600">No items found</CardContent></Card>
          )}
        </div>
      </main>
    </div>
  )
}


