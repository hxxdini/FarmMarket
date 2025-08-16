"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

export function useUnreadMessages() {
  const { data: session } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchUnreadCount = async () => {
    if (!session?.user?.email) {
      setUnreadCount(0)
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/conversations')
      if (response.ok) {
        const data = await response.json()
        const totalUnread = data.conversations.reduce(
          (total: number, conversation: any) => total + conversation.unreadCount,
          0
        )
        setUnreadCount(totalUnread)
      }
    } catch (error) {
      console.error('Error fetching unread messages:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.email) {
      fetchUnreadCount()

      // Poll for new messages more frequently for timely notifications
      const interval = setInterval(fetchUnreadCount, 10000)
      return () => clearInterval(interval)
    } else {
      setUnreadCount(0)
    }
  }, [session?.user?.email])

  return { unreadCount, loading, refetch: fetchUnreadCount }
}
