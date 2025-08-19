"use client"

import { useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function KnowledgeRepositoryPage() {
  const { status } = useSession()
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isVerifiedExpert, setIsVerifiedExpert] = useState(false)

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
        const res = await fetch('/api/community/experts/apply', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setIsVerifiedExpert(!!data?.profile?.isVerified)
        }
      } catch {}
    }
    loadProfile()
    return () => { cancelled = true }
  }, [status])

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Knowledge Repository</h1>
          <div className="flex items-center gap-3">
            <Input placeholder="Search articles..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
            {isVerifiedExpert && (
              <Link href="/community/knowledge/write" className="text-sm text-white bg-green-600 hover:bg-green-700 px-3 py-2 rounded-md">
                Write article
              </Link>
            )}
          </div>
        </div>
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


