"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, MapPin, Calendar, MessageCircle, ArrowLeft } from "lucide-react"
import { UserRatingSummary } from "@/components/ui/user-rating-summary"
import { ReviewsList } from "@/components/ui/reviews-list"
import { ReviewForm } from "@/components/ui/review-form"
import { toast } from "sonner"
import Link from "next/link"

interface UserProfile {
  id: string
  name: string
  email: string
  avatar: string
  bio: string
  location: string
  phone: string
  dateOfBirth: string
  gender: string
  preferredLanguage: string
  timezone: string
  isEmailVerified: boolean
  isPhoneVerified: boolean
  createdAt: string
  updatedAt: string
}

interface UserListing {
  id: string
  title: string
  price: number
  unit: string
  quantity: number
  quality: string
  location: string
  status: string
  createdAt: string
  image: string
}

export default function UserProfilePage() {
  const params = useParams()
  const { data: session } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [listings, setListings] = useState<UserListing[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  const userId = params.id as string

  useEffect(() => {
    if (userId) {
      fetchUserProfile()
      fetchUserListings()
    }
  }, [userId])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
      } else {
        toast.error('Failed to fetch user profile')
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      toast.error('Failed to fetch user profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserListings = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/listings`)
      if (response.ok) {
        const data = await response.json()
        setListings(data.listings)
      }
    } catch (error) {
      console.error('Error fetching user listings:', error)
    }
  }

  const handleContactUser = async () => {
    if (!session?.user?.email) {
      toast.error('Please log in to contact this user')
      return
    }

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          otherUserId: userId,
          initialMessage: `Hi ${profile?.name}, I'd like to connect with you about your products.`
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Message sent successfully!')
        // Navigate to the conversation
        window.location.href = `/messages/${data.conversation.id}`
      } else {
        toast.error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h1>
          <p className="text-gray-600 mb-4">The user you're looking for doesn't exist.</p>
          <Link href="/marketplace">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const isOwnProfile = session?.user?.email === profile.email

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <Link href="/marketplace">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-gray-600">Member since {new Date(profile.createdAt).toLocaleDateString()}</p>
            </div>
            {!isOwnProfile && session?.user?.email && (
              <Button onClick={handleContactUser}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            {!isOwnProfile && session?.user?.email && (
              <TabsTrigger value="write-review">Write Review</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={profile.avatar || undefined} />
                        <AvatarFallback className="text-2xl">
                          {profile.name ? profile.name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2) : profile.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-medium">{profile.name}</h3>
                        <p className="text-sm text-gray-600">{profile.email}</p>
                        {profile.location && (
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {profile.location}
                          </div>
                        )}
                      </div>
                    </div>

                    {profile.bio && (
                      <div>
                        <h4 className="font-medium mb-2">About</h4>
                        <p className="text-sm text-gray-600">{profile.bio}</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      {profile.phone && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Phone:</span>
                          <span>{profile.phone}</span>
                        </div>
                      )}
                      {profile.gender && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Gender:</span>
                          <span>{profile.gender}</span>
                        </div>
                      )}
                      {profile.preferredLanguage && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Language:</span>
                          <span>{profile.preferredLanguage}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      {profile.isEmailVerified && (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          Email Verified
                        </Badge>
                      )}
                      {profile.isPhoneVerified && (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          Phone Verified
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Rating Summary */}
              <div className="lg:col-span-2">
                <UserRatingSummary userId={profile.id} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="listings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Listings</CardTitle>
                <CardDescription>
                  Products currently available from {profile.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {listings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map((listing) => (
                      <Card key={listing.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
                            <img
                              src={listing.image || '/placeholder.svg'}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <h3 className="font-medium text-gray-900 mb-2">{listing.title}</h3>
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-lg font-bold text-green-600">
                              UGX {listing.price.toLocaleString()}
                            </p>
                            <Badge variant="outline">{listing.quality}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {listing.quantity} {listing.unit} available
                          </p>
                          <div className="flex items-center text-sm text-gray-500 mt-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            {listing.location}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No active listings found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <ReviewsList
              userId={profile.id}
              title={`Reviews for ${profile.name}`}
              description={`What others are saying about ${profile.name}`}
              showFilters={true}
            />
          </TabsContent>

          {!isOwnProfile && session?.user?.email && (
            <TabsContent value="write-review" className="space-y-6">
              <div className="max-w-2xl mx-auto">
                <ReviewForm
                  reviewedUserId={profile.id}
                  reviewedUserName={profile.name}
                  onReviewSubmitted={() => {
                    setActiveTab("reviews")
                    toast.success('Review submitted successfully and is pending admin approval!')
                  }}
                />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
