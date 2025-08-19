"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  Menu,
  TrendingUp,
  ShoppingCart,
  Users,
  Cloud,
  Bell,
  User,
  Settings,
  LogOut,
  Home,
  HelpCircle,
  MessageCircle,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"
import { useUnreadMessages } from "@/hooks/use-unread-messages"
import { usePriceAlertNotifications } from "@/hooks/use-price-alert-notifications"
import { useRef } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Navigation() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isAuthenticated = !!session?.user
  const userName = session?.user?.name || session?.user?.email || "Account"
  const userRole = (session?.user as any)?.role || 'user'
  const userId = (session?.user as any)?.id
  const notificationCount = 0 // Placeholder, actual count would need to be fetched
  const { unreadCount } = useUnreadMessages()
  const lastUnreadRef = useRef(0)

  const [isOpen, setIsOpen] = useState(false)
  const [recentUnreadMessages, setRecentUnreadMessages] = useState<any[]>([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  
  // Price alert notifications hook
  const { unreadCount: priceAlertCount } = usePriceAlertNotifications()

  // Close mobile menu on auth state change
  useEffect(() => {
    setIsOpen(false)
  }, [isAuthenticated])

  // Fetch recent unread messages for notifications
  const fetchRecentUnreadMessages = async () => {
    if (!session?.user?.email) return
    
    try {
      const response = await fetch('/api/conversations')
      if (response.ok) {
        const data = await response.json()
        const unreadConversations = data.conversations
          .filter((conv: any) => conv.unreadCount > 0)
          .slice(0, 5) // Show max 5 recent unread conversations
        setRecentUnreadMessages(unreadConversations)
      }
    } catch (error) {
      console.error('Error fetching unread messages:', error)
    }
  }



  // Show toast when new unread messages arrive
  useEffect(() => {
    // Skip on first render
    if (lastUnreadRef.current === 0 && unreadCount >= 0) {
      lastUnreadRef.current = unreadCount
      return
    }
    if (unreadCount > lastUnreadRef.current) {
      const diff = unreadCount - lastUnreadRef.current
      toast.info(`${diff} new message${diff > 1 ? 's' : ''}`)
      // Refresh recent unread messages
      fetchRecentUnreadMessages()
    }
    lastUnreadRef.current = unreadCount
  }, [unreadCount])

  // Fetch unread messages when notifications are opened
  useEffect(() => {
    if (notificationsOpen && isAuthenticated) {
      fetchRecentUnreadMessages()
    }
  }, [notificationsOpen, isAuthenticated])



  const navigationItems = [
    {
      name: "Market Prices",
      href: "/market-prices",
      icon: <TrendingUp className="h-4 w-4" />,
      description: "Real-time crop prices",
    },
    {
      name: "Marketplace",
      href: "/marketplace",
      icon: <ShoppingCart className="h-4 w-4" />,
      description: "Buy & sell directly",
    },
    {
      name: "Community",
      href: "/community",
      icon: <Users className="h-4 w-4" />,
      description: "Connect with farmers",
    },
    {
      name: "Weather",
      href: "/weather",
      icon: <Cloud className="h-4 w-4" />,
      description: "Forecasts & alerts",
    },

    // Role-based links (Admin dashboard link removed; logo already routes admins to /admin)
    ...(userRole === 'farmer' ? [
      {
        name: "My Listings",
        href: "/marketplace/my-listings",
        icon: <ShoppingCart className="h-4 w-4" />,
        description: "Manage your products",
      },
    ] : []),
    
    // Market price submission for all authenticated users
    // Removed from main navigation - now available on dashboards

  ]

  const MobileMenu = () => (
    <div className="flex flex-col space-y-1 p-4">
      {/* Dashboard link for authenticated users */}
      {isAuthenticated && (
        <Link
          href={
            userRole === 'admin' || userRole === 'superadmin' ? '/admin' : 
            userRole === 'farmer' ? '/dashboard/farmer' :
            '/dashboard/user'
          }
          className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setIsOpen(false)}
        >
          <Home className="h-5 w-5 text-green-600" />
          <div>
            <div className="font-medium text-gray-900">Dashboard</div>
            <div className="text-sm text-gray-500">
              {userRole === 'admin' || userRole === 'superadmin' ? 'Admin panel' : 
               userRole === 'farmer' ? 'Farmer overview' : 'Buyer overview'}
            </div>
          </div>
        </Link>
      )}

      {/* Main navigation items */}
      {navigationItems.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setIsOpen(false)}
        >
          <div className="text-gray-600">{item.icon}</div>
          <div>
            <div className="font-medium text-gray-900">{item.name}</div>
            <div className="text-sm text-gray-500">{item.description}</div>
          </div>
        </Link>
      ))}

      {/* Help & Support */}
      <Link
        href="/help"
        className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors"
        onClick={() => setIsOpen(false)}
      >
        <HelpCircle className="h-5 w-5 text-gray-600" />
        <div>
          <div className="font-medium text-gray-900">Help & Support</div>
          <div className="text-sm text-gray-500">Get assistance</div>
        </div>
      </Link>

      {/* Authentication buttons */}
      <div className="pt-4 border-t border-gray-200 mt-4">
        {isAuthenticated ? (
          <div className="space-y-2">
            <Link
              href="/messages"
              className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <MessageCircle className="h-5 w-5 text-gray-600" />
              <div className="flex-1">
                <div className="font-medium text-gray-900 flex items-center justify-between">
                  Messages
                  {unreadCount > 0 && (
                    <Badge className="h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-gray-500">Chat with buyers & sellers</div>
              </div>
            </Link>
            <Link
              href="/price-alerts"
              className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Bell className="h-5 w-5 text-gray-600" />
              <div className="flex-1">
                <div className="font-medium text-gray-900 flex items-center justify-between">
                  Price Alerts
                  {priceAlertCount > 0 && (
                    <Badge className="h-5 w-5 flex items-center justify-center p-0 text-xs bg-blue-500">
                      {priceAlertCount > 99 ? "99+" : priceAlertCount}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-gray-500">Monitor price changes</div>
              </div>
            </Link>
            <Link
              href={`/users/${userId}`}
              className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User className="h-5 w-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900">Profile</div>
                <div className="text-sm text-gray-500">View your public profile</div>
              </div>
            </Link>
            <Link
              href="/profile"
              className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="h-5 w-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900">Settings</div>
                <div className="text-sm text-gray-500">Account settings & preferences</div>
              </div>
            </Link>
            <button className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors w-full text-left" onClick={() => signOut({ callbackUrl: '/' })}>
              <LogOut className="h-5 w-5 text-red-600" />
              <div>
                <div className="font-medium text-red-600">Sign Out</div>
                <div className="text-sm text-gray-500">Log out of your account</div>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <Button className="w-full" asChild>
              <Link href="/register" onClick={() => setIsOpen(false)}>
                Get Started Free
              </Link>
            </Button>
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <Link href="/login" onClick={() => setIsOpen(false)}>
                Sign In
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={
            !isAuthenticated ? "/" : 
            (userRole === 'admin' || userRole === 'superadmin') ? "/admin" : 
            userRole === 'farmer' ? "/dashboard/farmer" :
            "/dashboard/user"
          } className="flex items-center">
            <h1 className="text-xl sm:text-2xl font-bold text-green-600">FarmMarket</h1>
            <span className="ml-2 text-xs sm:text-sm text-gray-500">Uganda</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-green-600 hover:bg-green-50 transition-colors"
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden lg:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="relative bg-transparent">
                      <Bell className="h-4 w-4" />
                      {(unreadCount > 0 || priceAlertCount > 0) && (
                        <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
                          {(unreadCount + priceAlertCount) > 99 ? "99+" : (unreadCount + priceAlertCount)}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      <p className="text-sm text-gray-500">Recent messages and price alerts</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {/* Price Alert Notifications */}
                      {priceAlertCount > 0 && (
                        <div className="p-3 bg-blue-50 border-b">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-blue-900">Price Alerts</h4>
                            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                              {priceAlertCount} new
                            </Badge>
                          </div>
                          <Link
                            href="/price-alerts"
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            onClick={() => setNotificationsOpen(false)}
                          >
                            View all price alerts →
                          </Link>
                        </div>
                      )}
                      
                      {/* Message Notifications */}
                      {recentUnreadMessages.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p>No unread messages</p>
                        </div>
                      ) : (
                        recentUnreadMessages.map((conversation) => (
                          <div
                            key={conversation.id}
                            className="p-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => {
                              setNotificationsOpen(false)
                              router.push(`/messages/${conversation.id}`)
                            }}
                          >
                            <div className="flex items-start space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={conversation.otherUser.avatar || undefined} />
                                <AvatarFallback className="text-xs">
                                  {conversation.otherUser.name.split(' ').map((n: string) => n.charAt(0)).join('').substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {conversation.otherUser.name}
                                  </p>
                                  <Badge variant="destructive" className="text-xs">
                                    {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                                  </Badge>
                                </div>
                                {conversation.listing && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    About: {conversation.listing.cropType}
                                  </p>
                                )}
                                {conversation.lastMessage && (
                                  <p className="text-xs text-gray-600 mt-1 truncate">
                                    {conversation.lastMessage.content}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {(recentUnreadMessages.length > 0 || priceAlertCount > 0) && (
                      <div className="p-3 border-t bg-gray-50">
                        <div className="flex items-center justify-between">
                          <Link
                            href="/messages"
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            onClick={() => setNotificationsOpen(false)}
                          >
                            View all messages →
                          </Link>
                          {priceAlertCount > 0 && (
                            <Link
                              href="/price-alerts"
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              onClick={() => setNotificationsOpen(false)}
                            >
                              View price alerts →
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-transparent">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">{userName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link 
                        href={
                          userRole === 'admin' || userRole === 'superadmin' ? '/admin' : 
                          userRole === 'farmer' ? '/dashboard/farmer' :
                          '/dashboard/user'
                        } 
                        className="flex items-center"
                      >
                        <Home className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/messages" className="flex items-center">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Messages
                        {unreadCount > 0 && (
                          <Badge className="h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/price-alerts" className="flex items-center">
                        <Bell className="h-4 w-4 mr-2" />
                        Price Alerts
                        {priceAlertCount > 0 && (
                          <Badge className="h-5 w-5 flex items-center justify-center p-0 text-xs bg-blue-500">
                            {priceAlertCount > 99 ? "99+" : priceAlertCount}
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/users/${userId}`} className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/help" className="flex items-center">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Help & Support
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600" onClick={() => signOut({ callbackUrl: '/' })}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-2">
            {/* Mobile Notifications for authenticated users */}
            {isAuthenticated && (
              <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="relative bg-transparent">
                    <Bell className="h-4 w-4" />
                    {(unreadCount > 0 || priceAlertCount > 0) && (
                      <Badge className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-xs bg-red-500">
                        {(unreadCount + priceAlertCount) > 99 ? "99+" : (unreadCount + priceAlertCount)}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    <p className="text-sm text-gray-500">Recent messages and price alerts</p>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {/* Price Alert Notifications */}
                    {priceAlertCount > 0 && (
                      <div className="p-3 bg-blue-50 border-b">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-blue-900">Price Alerts</h4>
                          <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                            {priceAlertCount} new
                          </Badge>
                        </div>
                        <Link
                          href="/price-alerts"
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          onClick={() => setNotificationsOpen(false)}
                        >
                          View all price alerts →
                        </Link>
                      </div>
                    )}
                    
                    {/* Message Notifications */}
                    {recentUnreadMessages.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>No unread messages</p>
                      </div>
                    ) : (
                      recentUnreadMessages.map((conversation) => (
                        <div
                          key={conversation.id}
                          className="p-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => {
                            setNotificationsOpen(false)
                            router.push(`/messages/${conversation.id}`)
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={conversation.otherUser.avatar || undefined} />
                                                          <AvatarFallback className="text-xs">
                              {conversation.otherUser.name.split(' ').map((n: string) => n.charAt(0)).join('').substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {conversation.otherUser.name}
                                </p>
                                <Badge variant="destructive" className="text-xs">
                                  {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                                </Badge>
                              </div>
                              {conversation.listing && (
                                <p className="text-xs text-gray-500 mt-1">
                                  About: {conversation.listing.cropType}
                                </p>
                              )}
                              {conversation.lastMessage && (
                                <p className="text-xs text-gray-600 mt-1 truncate">
                                  {conversation.lastMessage.content}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {(recentUnreadMessages.length > 0 || priceAlertCount > 0) && (
                    <div className="p-3 border-t bg-gray-50">
                      <div className="flex items-center justify-between">
                        <Link
                          href="/messages"
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          onClick={() => setNotificationsOpen(false)}
                        >
                          View all messages →
                        </Link>
                        {priceAlertCount > 0 && (
                          <Link
                            href="/price-alerts"
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            onClick={() => setNotificationsOpen(false)}
                          >
                            View price alerts →
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            )}

            {/* Mobile Menu Trigger */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center">
                    <h2 className="text-lg font-semibold text-green-600">FarmMarket</h2>
                    {isAuthenticated && userName && <span className="ml-2 text-sm text-gray-500">Hi, {userName}!</span>}
                  </div>
                </div>
                <MobileMenu />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Mobile Quick Access Bar */}
      <div className="lg:hidden bg-gray-50 border-t px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 overflow-x-auto">
            {navigationItems.slice(0, 3).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium text-gray-600 hover:text-green-600 whitespace-nowrap"
              >
                {item.icon}
                <span className="hidden sm:inline">{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
