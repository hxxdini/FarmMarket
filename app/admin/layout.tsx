"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  LayoutDashboard,
  Users, 
  ShoppingCart, 
  MessageCircle, 
  Star, 
  BarChart3,
  Settings,
  Shield,
  Activity,
  Menu,
  X,
  LogOut,
  Loader2,
  TrendingUp
} from "lucide-react"
import { toast } from "sonner"

interface AdminLayoutProps {
  children: React.ReactNode
}



export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      // Check if user is admin
      if ((session?.user as any)?.role !== 'admin' && (session?.user as any)?.role !== 'superadmin') {
        router.replace("/")
        toast.error("Access denied. Admin privileges required.")
        return
      }

    }
  }, [status, session, router])



  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      current: pathname === '/admin'
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: Users,
      current: pathname.startsWith('/admin/users')
    },
    {
      name: 'Community Moderation',
      href: '/admin/moderation/community',
      icon: Shield,
      current: pathname.startsWith('/admin/moderation/community')
    },
    {
      name: 'Review Moderation',
      href: '/admin/moderation/reviews',
      icon: Star,
      current: pathname.startsWith('/admin/moderation/reviews')
    },
    {
      name: 'Market Prices',
      href: '/admin/market-prices',
      icon: TrendingUp,
      current: pathname.startsWith('/admin/market-prices')
    },
    {
      name: 'Analytics',
      href: '/admin/analytics/overview',
      icon: BarChart3,
      current: pathname.startsWith('/admin/analytics')
    }
  ]

  const handleSignOut = async () => {
    const { signOut } = await import("next-auth/react")
    await signOut({ callbackUrl: "/login" })
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading admin dashboard...</span>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none lg:z-auto lg:shadow-lg lg:flex lg:flex-col lg:min-h-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex items-center justify-between h-16 px-3 sm:px-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100 flex-shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-green-500 rounded-lg shadow-sm">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900">Admin Panel</h1>
              <p className="text-xs text-gray-600">Platform Management</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden hover:bg-green-200 p-1 sm:p-2"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 sm:px-4 pt-4 sm:pt-6 pb-24 sm:pb-28 space-y-1 sm:space-y-2 overflow-y-auto min-h-0">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  item.current
                    ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200 shadow-sm'
                    : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 hover:text-gray-900 hover:shadow-sm'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className={`p-1 sm:p-1.5 rounded-md transition-colors ${
                    item.current 
                      ? 'bg-green-200' 
                      : 'group-hover:bg-gray-200'
                  }`}>
                    <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${item.current ? 'text-green-700' : 'text-gray-500 group-hover:text-gray-700'}`} />
                  </div>
                  <span className="font-medium text-sm">{item.name}</span>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* User section (sticky) */}
        <div className="border-t border-gray-200 p-3 sm:p-4 bg-white sticky bottom-0 flex-shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
              <AvatarImage src={(session?.user as any)?.avatar} alt={(session?.user as any)?.name} />
              <AvatarFallback className="text-xs sm:text-sm">{(session?.user as any)?.name ? (session?.user as any)?.name.split(' ').map((n: string) => n.charAt(0)).join('').substring(0, 2) : 'A'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                {(session?.user as any)?.name || session?.user?.email}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {(session?.user as any)?.role === 'superadmin' ? 'Super Admin' : 'Admin'}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Link href="/marketplace">
              <Button variant="outline" size="sm" className="w-full justify-start text-xs sm:text-sm h-8 sm:h-9">
                <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                View Marketplace
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs sm:text-sm h-8 sm:h-9"
              onClick={handleSignOut}
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile menu button - positioned fixed for mobile only */}
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <Button
            variant="outline"
            size="sm"
            className="bg-white shadow-lg border-2 border-gray-200 hover:bg-gray-50 h-14 w-14 p-0 rounded-full transition-all duration-200 hover:scale-105"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open admin menu"
          >
            <Menu className="h-7 w-7" />
          </Button>
          {/* Visual indicator */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}
