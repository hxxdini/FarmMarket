"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, 
  Settings, 
  CreditCard, 
  Bell, 
  Shield, 
  Camera, 
  Save,
  Loader2,
  CheckCircle,
  X
} from "lucide-react"
import { toast } from "sonner"
import { ImageUpload } from "@/components/ui/image-upload"
import { ReviewsList } from "@/components/ui/reviews-list"
import { UserRatingSummary } from "@/components/ui/user-rating-summary"

interface UserProfile {
  id: string
  email: string
  name: string
  phone: string
  location: string
  avatar: string
  bio: string
  dateOfBirth: string
  gender: string
  preferredLanguage: string
  timezone: string
  isEmailVerified: boolean
  isPhoneVerified: boolean
  subscriptionPlan: string
  subscriptionStatus: string
  subscriptionEndsAt: string
  billingAddress: string
  taxId: string
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  marketingEmails: boolean
  twoFactorEnabled: boolean
  createdAt: string
  updatedAt: string
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState("profile")
  const [avatarUpdated, setAvatarUpdated] = useState(false)
  const [avatarKey, setAvatarKey] = useState(0)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      fetchProfile()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
      } else {
        toast.error('Failed to fetch profile')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async (updatedData: Partial<UserProfile>) => {
    try {
      setSaving(true)
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      })

      if (response.ok) {
        toast.success('Profile updated successfully!')
        fetchProfile()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (images: any[]) => {
    if (images.length > 0 && images[0].url) {

      // Immediately update local state for instant visual feedback
      setProfile(prev => ({ ...prev, avatar: images[0].url }))
      setAvatarUpdated(true)
      setAvatarKey(prev => prev + 1) // Force Avatar component to re-render
      // Then update the database
      await handleProfileUpdate({ avatar: images[0].url })
      // Reset the flag after a delay
      setTimeout(() => setAvatarUpdated(false), 3000)
    }
  }

  const handleDeleteAvatar = async () => {
    try {
      // Delete the image from blob storage if it exists
      if (profile.avatar) {
        try {
          await fetch('/api/upload', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: profile.avatar })
          })
        } catch (error) {
          console.error('Error deleting image from blob storage:', error)
          // Continue with profile update even if blob deletion fails
        }
      }

      // Update profile to remove avatar
      setProfile(prev => ({ ...prev, avatar: '' }))
      setAvatarKey(prev => prev + 1) // Force Avatar component to re-render
      await handleProfileUpdate({ avatar: '' })
      
      toast.success('Profile picture removed successfully!')
    } catch (error) {
      console.error('Error removing avatar:', error)
      toast.error('Failed to remove profile picture')
    }
  }

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }
  if (status === "unauthenticated") {
    return null
  }
  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center">Profile not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-lg text-gray-600">Manage your account settings and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
        <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information and profile picture</CardDescription>
        </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="relative">
                      <Avatar className="h-24 w-24" key={`avatar-${avatarKey}`}>
                        <AvatarImage 
                          src={profile.avatar || undefined} 
                          alt={profile.name} 
                        />
                        <AvatarFallback className="text-2xl">
                          {profile.name ? profile.name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2) : profile.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {avatarUpdated && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 animate-pulse">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                      )}
                      {profile.avatar && (
                        <button
                          onClick={handleDeleteAvatar}
                          className="absolute -bottom-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          title="Remove profile picture"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                                      <div className="flex-1">
                      <h3 className="text-lg font-medium">Profile Picture</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Upload a new profile picture. Recommended size: 400x400 pixels.
                      </p>

                    <ImageUpload
                      onImagesChange={handleAvatarChange}
                      maxImages={1}
                      folder="profiles"
                      showPreview={true}
                      currentImages={profile.avatar ? [{ id: 'current', url: profile.avatar, file: null as any, preview: profile.avatar }] : []}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={profile.name || ''}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      value={profile.email}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={profile.phone || ''}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      value={profile.location || ''}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      placeholder="Enter your location"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={profile.bio || ''}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={() => handleProfileUpdate(profile)} 
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Manage your account details and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={profile.dateOfBirth || ''}
                      onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      name="gender"
                      value={profile.gender || ''}
                      onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredLanguage">Preferred Language</Label>
                    <select
                      id="preferredLanguage"
                      name="preferredLanguage"
                      value={profile.preferredLanguage || 'en'}
                      onChange={(e) => setProfile({ ...profile, preferredLanguage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="en">English</option>
                      <option value="sw">Swahili</option>
                      <option value="lg">Luganda</option>
                      <option value="fr">French</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <select
                      id="timezone"
                      name="timezone"
                      value={profile.timezone || 'UTC'}
                      onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="UTC">UTC</option>
                      <option value="Africa/Kampala">Africa/Kampala (EAT)</option>
                      <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                      <option value="Africa/Dar_es_Salaam">Africa/Dar es Salaam (EAT)</option>
                    </select>
            </div>
          </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Email Verification</h3>
                      <p className="text-sm text-gray-500">
                        {profile.isEmailVerified ? 'Your email is verified' : 'Please verify your email address'}
                      </p>
                    </div>
                    <Badge variant={profile.isEmailVerified ? "default" : "secondary"}>
                      {profile.isEmailVerified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
                      <h3 className="font-medium">Phone Verification</h3>
                      <p className="text-sm text-gray-500">
                        {profile.isPhoneVerified ? 'Your phone is verified' : 'Please verify your phone number'}
                      </p>
                    </div>
                    <Badge variant={profile.isPhoneVerified ? "default" : "secondary"}>
                      {profile.isPhoneVerified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                </div>

                <Button 
                  onClick={() => handleProfileUpdate(profile)} 
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Account Settings
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing & Subscription</CardTitle>
                <CardDescription>Manage your subscription and billing information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Current Plan</h3>
                      <Badge variant="default">{profile.subscriptionPlan}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      Status: {profile.subscriptionStatus}
                    </p>
                    {profile.subscriptionEndsAt && (
                      <p className="text-sm text-gray-500 mt-1">
                        Expires: {new Date(profile.subscriptionEndsAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Plan Features</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Unlimited product listings</li>
                      <li>• Advanced analytics</li>
                      <li>• Priority support</li>
                      <li>• Custom branding</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingAddress">Billing Address</Label>
                    <Textarea
                      id="billingAddress"
                      name="billingAddress"
                      value={profile.billingAddress || ''}
                      onChange={(e) => setProfile({ ...profile, billingAddress: e.target.value })}
                      placeholder="Enter your billing address..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                    <Input
                      id="taxId"
                      name="taxId"
                      value={profile.taxId || ''}
                      onChange={(e) => setProfile({ ...profile, taxId: e.target.value })}
                      placeholder="Enter your tax ID or VAT number"
                    />
                  </div>
            </div>

                <Button 
                  onClick={() => handleProfileUpdate(profile)} 
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Billing Information
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
                      <h3 className="font-medium">Email Notifications</h3>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.emailNotifications}
                      onChange={(e) => handleProfileUpdate({ emailNotifications: e.target.checked })}
                      className="h-4 w-4"
                    />
            </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
                      <h3 className="font-medium">SMS Notifications</h3>
                      <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.smsNotifications}
                      onChange={(e) => handleProfileUpdate({ smsNotifications: e.target.checked })}
                      className="h-4 w-4"
                    />
            </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
                      <h3 className="font-medium">Push Notifications</h3>
                      <p className="text-sm text-gray-500">Receive push notifications in the app</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.pushNotifications}
                      onChange={(e) => handleProfileUpdate({ pushNotifications: e.target.checked })}
                      className="h-4 w-4"
                    />
            </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
                      <h3 className="font-medium">Marketing Emails</h3>
                      <p className="text-sm text-gray-500">Receive promotional and marketing emails</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profile.marketingEmails}
                      onChange={(e) => handleProfileUpdate({ marketingEmails: e.target.checked })}
                      className="h-4 w-4"
                    />
                  </div>
            </div>

                <Button 
                  onClick={() => handleProfileUpdate(profile)} 
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Notification Preferences
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security and privacy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
                      <h3 className="font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-500">
                        {profile.twoFactorEnabled ? 'Enabled' : 'Add an extra layer of security to your account'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={profile.twoFactorEnabled ? "default" : "secondary"}>
                        {profile.twoFactorEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                      <Button variant="outline" size="sm">
                        {profile.twoFactorEnabled ? "Manage" : "Enable"}
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Account Activity</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>Created: {new Date(profile.createdAt).toLocaleDateString()}</p>
                      <p>Last updated: {new Date(profile.updatedAt).toLocaleDateString()}</p>
                    </div>
            </div>

                  <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                    <h3 className="font-medium text-yellow-800 mb-2">Danger Zone</h3>
                    <p className="text-sm text-yellow-700 mb-4">
                      These actions cannot be undone. Please proceed with caution.
                    </p>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
                        Change Password
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
                        Deactivate Account
            </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Reviews</CardTitle>
                <CardDescription>View and manage your reviews and ratings</CardDescription>
              </CardHeader>
              <CardContent>
                <ReviewsList
                  userId={profile.id}
                  mode="written"
                  title="Reviews I've Written"
                  description="Reviews you've submitted for other users and products"
                  showFilters={true}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reviews About Me</CardTitle>
                <CardDescription>See what others are saying about you</CardDescription>
              </CardHeader>
              <CardContent>
                <UserRatingSummary userId={profile.id} />
        </CardContent>
      </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
} 