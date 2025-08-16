"use client"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function hasSessionCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie.includes("next-auth.session-token");
}

export default function NotFoundPage() {
  const { data: session, status } = useSession()
  const isLoggedIn = status === "authenticated" || hasSessionCookie();
  const userRole = (session?.user as any)?.role
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mt-8">
        <CardHeader>
          <CardTitle>404 - Page Not Found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-600">Sorry, the page you are looking for does not exist.</p>
          {isLoggedIn ? (
            <Button asChild>
              <Link href={userRole === 'admin' || userRole === 'superadmin' ? '/admin' : '/dashboard'}>
                {userRole === 'admin' || userRole === 'superadmin' ? 'Go to Admin Dashboard' : 'Go to Dashboard'}
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/">Go to Home</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 