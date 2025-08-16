"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { ImageUpload } from "@/components/ui/image-upload"

interface ProductFormData {
  cropType: string
  quantity: string
  unit: string
  pricePerUnit: string
  quality: string
  location: string
  description: string
  harvestDate: string
  availableUntil: string
}

interface ImageFile {
  id: string
  file: File
  preview: string
  url?: string
}

export default function CreateListingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<ImageFile[]>([])
  
  const [formData, setFormData] = useState<ProductFormData>({
    cropType: "",
    quantity: "",
    unit: "",
    pricePerUnit: "",
    quality: "",
    location: "",
    description: "",
    harvestDate: "",
    availableUntil: ""
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImagesChange = (newImages: ImageFile[]) => {
    setImages(newImages)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user?.email) {
      toast.error("You must be logged in to create a listing")
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

      // First, upload all selected images
      const uploadedImages: any[] = []
      if (images.length > 0) {
        toast.info("Uploading images...")
        
        for (let i = 0; i < images.length; i++) {
          const image = images[i]
          
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
        
        toast.success("Images uploaded successfully!")
      }

      // Create the product listing
      const listingResponse = await fetch('/api/marketplace/listings', {
        method: 'POST',
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
          availableUntil: formData.availableUntil || null
        })
      })

      if (!listingResponse.ok) {
        const error = await listingResponse.json()
        throw new Error(error.error || 'Failed to create listing')
      }

      const listingResult = await listingResponse.json()
      const listingId = listingResult.listing.id

      // If there are uploaded images, create ProductImage records
      if (uploadedImages.length > 0) {
        for (let i = 0; i < uploadedImages.length; i++) {
          const image = uploadedImages[i]
          
          // Create ProductImage record
          await fetch('/api/marketplace/listings/images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              listingId,
              url: image.url,
              altText: `Product image ${i + 1}`,
              order: i,
              isPrimary: i === 0 // First image is primary
            })
          })
        }
      }

      toast.success("Listing created successfully!")
      
      // Show success message with option to view the listing
      toast.success(
        <div className="space-y-2">
          <p>Listing created successfully!</p>
          <Button 
            size="sm" 
            onClick={() => router.push(`/marketplace/${listingId}`)}
            className="w-full"
          >
            View Your Listing
          </Button>
        </div>,
        { duration: 5000 }
      )
      
      // Redirect after a short delay to allow user to click the view button
      setTimeout(() => {
        router.push('/marketplace/my-listings')
      }, 2000)
    } catch (error) {
      console.error('Error creating listing:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create listing')
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You must be logged in to create a listing.</p>
          <Button onClick={() => router.push('/login')}>Go to Login</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Listing</h1>
          <p className="text-lg text-gray-600">Add your product to the marketplace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Essential details about your product</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cropType">Crop Type *</Label>
                  <Select value={formData.cropType} onValueChange={(value) => handleSelectChange('cropType', value)}>
                    <SelectTrigger id="cropType" name="cropType">
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
                  <Label htmlFor="quality">Quality *</Label>
                  <Select value={formData.quality} onValueChange={(value) => handleSelectChange('quality', value)}>
                    <SelectTrigger id="quality" name="quality">
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
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="Enter quantity"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Select value={formData.unit} onValueChange={(value) => handleSelectChange('unit', value)}>
                    <SelectTrigger id="unit" name="unit">
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
                  <Label htmlFor="pricePerUnit">Price per Unit *</Label>
                  <Input
                    id="pricePerUnit"
                    name="pricePerUnit"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pricePerUnit}
                    onChange={handleInputChange}
                    placeholder="Enter price per unit"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Enter location"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your product, growing conditions, etc."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Harvest & Availability</CardTitle>
              <CardDescription>When was it harvested and how long is it available?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="harvestDate">Harvest Date</Label>
                  <Input
                    id="harvestDate"
                    name="harvestDate"
                    type="date"
                    value={formData.harvestDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availableUntil">Available Until</Label>
                  <Input
                    id="availableUntil"
                    name="availableUntil"
                    type="date"
                    value={formData.availableUntil}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Images */}
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
              <CardDescription>Upload photos of your product (optional but recommended)</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                onImagesChange={handleImagesChange}
                maxImages={5}
                maxSize={10}
                folder="products"
                showPreview={true}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/marketplace/my-listings')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? "Creating..." : "Create Listing"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
