"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardIndexPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return
    
    if (status === "unauthenticated") {
      router.replace("/login")
      return
    }

    // Redirect to role-specific dashboard
    const userRole = (session?.user as any)?.role
    if (userRole === 'farmer') {
      router.replace("/dashboard/farmer")
    } else if (userRole === 'admin' || userRole === 'superadmin') {
      router.replace("/admin")
    } else {
      router.replace("/dashboard/user")
    }
  }, [status, session, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}
