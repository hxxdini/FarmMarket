"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2, X, Star } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { ImageUpload } from "@/components/ui/image-upload"
import Image from "next/image"

interface ProductImage {
  id: string
  url: string
  altText?: string
  isPrimary: boolean
  order: number
}

interface ProductListing {
  id: string
  cropType: string
  quantity: number
  unit: string
  pricePerUnit: number
  quality: string
  status: string
  location: string
  description?: string
  harvestDate?: string
  availableUntil?: string
  images: ProductImage[]
}

interface ImageFile {
  id: string
  file: File
  preview: string
  url?: string
}

interface FormData {
  cropType: string
  quantity: string
  unit: string
  pricePerUnit: string
  quality: string
  location: string
  description: string
  harvestDate: string
  availableUntil: string
  status: string
}

export default function EditListingPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [listing, setListing] = useState<ProductListing | null>(null)
  const [newImages, setNewImages] = useState<ImageFile[]>([])
  const [formData, setFormData] = useState<FormData>({
    cropType: '',
    quantity: '',
    unit: '',
    pricePerUnit: '',
    quality: '',
    location: '',
    description: '',
    harvestDate: '',
    availableUntil: '',
    status: ''
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      fetchListing()
    }
  }, [status, router, params.id])

  const fetchListing = async () => {
    try {
      setFetching(true)
      const response = await fetch(`/api/marketplace/listings/${params.id}/edit`)
      if (response.ok) {
        const data = await response.json()
        setListing(data.listing)
        setFormData({
          cropType: data.listing.cropType,
          quantity: data.listing.quantity.toString(),
          unit: data.listing.unit,
          pricePerUnit: data.listing.pricePerUnit.toString(),
          quality: data.listing.quality,
          location: data.listing.location,
          description: data.listing.description || '',
          harvestDate: data.listing.harvestDate ? data.listing.harvestDate.split('T')[0] : '',
          availableUntil: data.listing.availableUntil ? data.listing.availableUntil.split('T')[0] : '',
          status: data.listing.status
        })
      } else {
        toast.error('Failed to fetch listing')
        router.push('/marketplace/my-listings')
      }
    } catch (error) {
      console.error('Error fetching listing:', error)
      toast.error('Failed to fetch listing')
      router.push('/marketplace/my-listings')
    } finally {
      setFetching(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNewImagesChange = (images: ImageFile[]) => {
    setNewImages(images)
  }

  const handleRemoveExistingImage = async (imageId: string) => {
    if (!listing) return

    try {
      const response = await fetch(`/api/marketplace/listings/images?imageId=${imageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove from local state
        setListing(prev => prev ? {
          ...prev,
          images: prev.images.filter(img => img.id !== imageId)
        } : null)
        toast.success('Image removed successfully')
      } else {
        toast.error('Failed to remove image')
      }
    } catch (error) {
      console.error('Error removing image:', error)
      toast.error('Failed to remove image')
    }
  }

  const handleSetPrimaryImage = async (imageId: string) => {
    if (!listing) return

    try {
      const response = await fetch('/api/marketplace/listings/images', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId,
          isPrimary: true
        })
      })

      if (response.ok) {
        // Update local state
        setListing(prev => prev ? {
          ...prev,
          images: prev.images.map(img => ({
            ...img,
            isPrimary: img.id === imageId
          }))
        } : null)
        toast.success('Primary image updated')
      } else {
        toast.error('Failed to update primary image')
      }
    } catch (error) {
      console.error('Error updating primary image:', error)
      toast.error('Failed to update primary image')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user?.email) {
      toast.error("You must be logged in to edit a listing")
      return
    }

    // Validate required fields
    if (!formData.cropType || !formData.quantity || !formData.unit || !formData.pricePerUnit || !formData.quality || !formData.location) {
      toast.error("Please fill in all required fields")
      return
    }

    if (parseFloat(formData.quantity) <= 0) {
      toast.error("Quantity must be greater than 0")
      return
    }

    if (parseFloat(formData.pricePerUnit) <= 0) {
      toast.error("Price per unit must be greater than 0")
      return
    }

    try {
      setLoading(true)

      // First, upload any new images
      const uploadedImages: any[] = []
      if (newImages.length > 0) {
        toast.info("Uploading new images...")
        
        for (let i = 0; i < newImages.length; i++) {
          const image = newImages[i]
          
          // Skip if already uploaded
          if (image.url) {
            uploadedImages.push(image)
            continue
          }

          // Upload the image
          const formData = new FormData()
          formData.append('file', image.file)
          formData.append('folder', 'products')

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          })

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload image ${i + 1}`)
          }

          const uploadResult = await uploadResponse.json()
          uploadedImages.push({
            ...image,
            url: uploadResult.image.url
          })
        }
        
        toast.success("New images uploaded successfully!")
      }

      // Update the listing
      const updateResponse = await fetch(`/api/marketplace/listings/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropType: formData.cropType,
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          pricePerUnit: parseFloat(formData.pricePerUnit),
          quality: formData.quality,
          location: formData.location,
          description: formData.description || null,
          harvestDate: formData.harvestDate || null,
          availableUntil: formData.availableUntil || null,
          status: formData.status
        })
      })

      if (!updateResponse.ok) {
        const error = await updateResponse.json()
        throw new Error(error.error || 'Failed to update listing')
      }

      // If there are new uploaded images, create ProductImage records
      if (uploadedImages.length > 0) {
        const currentImageCount = listing?.images.length || 0
        
        for (let i = 0; i < uploadedImages.length; i++) {
          const image = uploadedImages[i]
          
          // Create ProductImage record
          await fetch('/api/marketplace/listings/images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              listingId: params.id,
              url: image.url,
              altText: `Product image ${currentImageCount + i + 1}`,
              order: currentImageCount + i,
              isPrimary: currentImageCount === 0 && i === 0 // Primary if no existing images
            })
          })
        }
      }

      toast.success("Listing updated successfully!")
      router.push('/marketplace/my-listings')
    } catch (error) {
      console.error('Error updating listing:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update listing')
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading listing details...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Listing Not Found</h1>
          <p className="text-gray-600 mb-6">The listing you're trying to edit doesn't exist or you don't have permission to edit it.</p>
          <Button onClick={() => router.push('/marketplace/my-listings')}>
            Back to My Listings
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <Link href="/marketplace/my-listings" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Listings
          </Link>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Edit Listing</h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600">Update your product information and images</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Basic Information */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
              <CardTitle className="text-base sm:text-lg">Basic Information</CardTitle>
              <CardDescription className="text-sm">Update your product details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cropType" className="text-sm">Crop Type *</Label>
                  <Select value={formData.cropType} onValueChange={(value) => handleInputChange('cropType', value)}>
                    <SelectTrigger id="cropType" name="cropType" className="h-10">
                      <SelectValue placeholder="Select crop type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Maize">Maize</SelectItem>
                      <SelectItem value="Beans">Beans</SelectItem>
                      <SelectItem value="Rice">Rice</SelectItem>
                      <SelectItem value="Coffee">Coffee</SelectItem>
                      <SelectItem value="Tea">Tea</SelectItem>
                      <SelectItem value="Bananas">Bananas</SelectItem>
                      <SelectItem value="Cassava">Cassava</SelectItem>
                      <SelectItem value="Sweet Potatoes">Sweet Potatoes</SelectItem>
                      <SelectItem value="Tomatoes">Tomatoes</SelectItem>
                      <SelectItem value="Onions">Onions</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm">Quantity *</Label>
                  <Input 
                    id="quantity" 
                    name="quantity"
                    type="number" 
                    step="0.01"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    required 
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit" className="text-sm">Unit *</Label>
                  <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                    <SelectTrigger id="unit" name="unit" className="h-10">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      <SelectItem value="tons">Tons</SelectItem>
                      <SelectItem value="bags">Bags</SelectItem>
                      <SelectItem value="bunches">Bunches</SelectItem>
                      <SelectItem value="pieces">Pieces</SelectItem>
                      <SelectItem value="liters">Liters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricePerUnit" className="text-sm">Price per Unit *</Label>
                  <Input 
                    id="pricePerUnit" 
                    name="pricePerUnit"
                    type="number" 
                    step="0.01"
                    min="0"
                    value={formData.pricePerUnit}
                    onChange={(e) => handleInputChange('pricePerUnit', e.target.value)}
                    required 
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quality" className="text-sm">Quality *</Label>
                  <Select value={formData.quality} onValueChange={(value) => handleInputChange('quality', value)}>
                    <SelectTrigger id="quality" name="quality" className="h-10">
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Premium">Premium</SelectItem>
                      <SelectItem value="Standard">Standard</SelectItem>
                      <SelectItem value="Basic">Basic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm">Location *</Label>
                  <Input 
                    id="location" 
                    name="location"
                    placeholder="e.g., Kampala, Mbale" 
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    required 
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger id="status" name="status" className="h-10">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="SOLD">Sold</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm">Description</Label>
                <Textarea 
                  id="description" 
                  name="description"
                  placeholder="Describe your product, harvest date, storage conditions, etc."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="harvestDate" className="text-sm">Harvest Date</Label>
                  <Input 
                    id="harvestDate" 
                    name="harvestDate"
                    type="date" 
                    value={formData.harvestDate}
                    onChange={(e) => handleInputChange('harvestDate', e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availableUntil" className="text-sm">Available Until</Label>
                  <Input 
                    id="availableUntil" 
                    name="availableUntil"
                    type="date" 
                    value={formData.availableUntil}
                    onChange={(e) => handleInputChange('availableUntil', e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Existing Images */}
          {listing.images && listing.images.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
                <CardTitle className="text-base sm:text-lg">Current Images</CardTitle>
                <CardDescription className="text-sm">Manage your existing product images</CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {listing.images.map((image, index) => (
                    <div key={image.id} className="relative group">
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={image.url}
                          alt={image.altText || `Product image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        
                        {/* Primary Image Badge */}
                        {image.isPrimary && (
                          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Primary
                          </div>
                        )}

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(image.id)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>

                        {/* Set Primary Button */}
                        {!image.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(image.id)}
                            className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Set Primary
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add New Images */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
              <CardTitle className="text-base sm:text-lg">Add New Images</CardTitle>
              <CardDescription className="text-sm">Upload additional photos for your product</CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <ImageUpload
                onImagesChange={handleNewImagesChange}
                maxImages={5}
                maxSize={10}
                folder="products"
                showPreview={true}
              />
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6">
            <Button variant="outline" type="button" asChild className="w-full sm:w-auto h-10">
              <Link href={`/marketplace/${params.id}`}>View in Marketplace</Link>
            </Button>
            <Button variant="outline" type="button" asChild className="w-full sm:w-auto h-10">
              <Link href="/marketplace/my-listings">Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto h-10">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Listing'
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
