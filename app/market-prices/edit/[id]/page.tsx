"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { ArrowLeft, Upload, CheckCircle, Info, Loader2 } from "lucide-react"

interface MarketPrice {
  id: string
  cropType: string
  pricePerUnit: number
  unit: string
  quality: 'PREMIUM' | 'STANDARD' | 'ECONOMY'
  location: string
  source: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  submittedBy: {
    id: string
    name: string
    location: string
  }
  effectiveDate: string
  expiryDate?: string
  createdAt: string
  updatedAt: string
}

interface PriceEditForm {
  cropType: string
  pricePerUnit: string
  unit: string
  quality: 'PREMIUM' | 'STANDARD' | 'ECONOMY'
  location: string
  source: string
  effectiveDate: string
  expiryDate: string
}

const QUALITY_OPTIONS = [
  { value: 'PREMIUM', label: 'Premium', description: 'High quality, certified organic, premium grade' },
  { value: 'STANDARD', label: 'Standard', description: 'Standard quality, good condition, regular grade' },
  { value: 'ECONOMY', label: 'Economy', description: 'Economy grade, basic quality, value option' }
]

const UNIT_OPTIONS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'ton', label: 'Ton' },
  { value: 'bag', label: 'Bag' },
  { value: 'piece', label: 'Piece' },
  { value: 'bundle', label: 'Bundle' },
  { value: 'dozen', label: 'Dozen' }
]

const SOURCE_OPTIONS = [
  { value: 'FARMER_SUBMISSION', label: 'Farmer Submission', description: 'Direct from farmer' },
  { value: 'EXTENSION_OFFICER', label: 'Extension Officer', description: 'From agricultural officer' },
  { value: 'MARKET_SURVEY', label: 'Market Survey', description: 'From market research' }
]

export default function EditMarketPricePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const priceId = params.id as string
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [price, setPrice] = useState<MarketPrice | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showEditWarning, setShowEditWarning] = useState(false)
  
  const [formData, setFormData] = useState<PriceEditForm>({
    cropType: '',
    pricePerUnit: '',
    unit: 'kg',
    quality: 'STANDARD',
    location: '',
    source: 'FARMER_SUBMISSION',
    effectiveDate: new Date().toISOString().split('T')[0],
    expiryDate: ''
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      fetchCurrentUserId()
      fetchPrice()
    }
  }, [status, router, priceId])

  const fetchCurrentUserId = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setCurrentUserId(data.profile.id)
      }
    } catch (error) {
      console.error('Error fetching current user ID:', error)
    }
  }

  const fetchPrice = async () => {
    try {
      setFetching(true)
      const response = await fetch(`/api/market-prices/${priceId}`)
      
      if (response.ok) {
        const data = await response.json()
        const priceData = data.data
        
        // Defer ownership check until currentUserId is loaded
        if (currentUserId && priceData.submittedBy.id !== currentUserId) {
          toast.error('You can only edit your own prices')
          router.push('/market-prices')
          return
        }
        
        setPrice(priceData)
        setFormData({
          cropType: priceData.cropType,
          pricePerUnit: priceData.pricePerUnit.toString(),
          unit: priceData.unit,
          quality: priceData.quality,
          location: priceData.location,
          source: priceData.source,
          effectiveDate: new Date(priceData.effectiveDate).toISOString().split('T')[0],
          expiryDate: priceData.expiryDate ? new Date(priceData.expiryDate).toISOString().split('T')[0] : ''
        })
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to fetch price')
        router.push('/market-prices')
      }
    } catch (error) {
      console.error('Error fetching price:', error)
      toast.error('Failed to fetch price')
      router.push('/market-prices')
    } finally {
      setFetching(false)
    }
  }

  const handleInputChange = (field: keyof PriceEditForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)
      
      const response = await fetch(`/api/market-prices/${priceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          pricePerUnit: parseFloat(formData.pricePerUnit)
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('Price updated successfully and submitted for review')
        router.push('/market-prices')
      } else {
        const error = await response.json()
        console.error('Update API Error:', error)
        toast.error(error.error || 'Failed to update price')
      }
    } catch (error) {
      console.error('Error updating price:', error)
      toast.error('Failed to update price')
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  if (!price) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">Price not found or you don't have permission to edit it.</p>
              <Button onClick={() => router.push('/market-prices')} className="mt-4">
                Back to Market Prices
              </Button>
            </CardContent>
                  </Card>
      </main>

      {/* Edit Warning Dialog */}
      {showEditWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Approved Price
            </h3>
            <p className="text-gray-600 mb-6">
              This price is currently approved and visible to users. Any changes will require re-approval by administrators and the price will be temporarily hidden from the public view.
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowEditWarning(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowEditWarning(false)
                  handleSubmit(new Event('submit') as any)
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Continue Editing
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/market-prices')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Market Prices
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Market Price</h1>
              <p className="text-gray-600 mt-1">
                Update the details for your {price.cropType} price submission
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={`
                ${price.status === 'APPROVED' ? 'text-green-600 border-green-300' : ''}
                ${price.status === 'PENDING' ? 'text-yellow-600 border-yellow-300' : ''}
                ${price.status === 'REJECTED' ? 'text-red-600 border-red-300' : ''}
                ${price.status === 'EXPIRED' ? 'text-gray-600 border-gray-300' : ''}
              `}>
                {price.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Price Details</CardTitle>
            <CardDescription>
              Make changes to your price submission. 
              {price.status === 'PENDING' ? 'Updates will keep the price in pending status for review.' : 
               'Note that edited prices will need to be reviewed again by administrators. The status will be reset to pending for review.'}
              {price.status === 'APPROVED' && (
                <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Important:</strong> This price is currently approved and visible to users. 
                    Any changes will require re-approval by administrators.
                  </p>
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault()
              if (price.status === 'APPROVED') {
                setShowEditWarning(true)
              } else {
                handleSubmit(e)
              }
            }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Crop Type */}
                <div>
                  <Label htmlFor="cropType">Crop Type *</Label>
                  <Input
                    id="cropType"
                    name="cropType"
                    value={formData.cropType}
                    onChange={(e) => handleInputChange('cropType', e.target.value)}
                    placeholder="e.g., Maize, Beans, Coffee"
                    required
                  />
                </div>

                {/* Price Per Unit */}
                <div>
                  <Label htmlFor="pricePerUnit">Price Per Unit (UGX) *</Label>
                  <Input
                    id="pricePerUnit"
                    name="pricePerUnit"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pricePerUnit}
                    onChange={(e) => handleInputChange('pricePerUnit', e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Unit */}
                <div>
                  <Label htmlFor="unit">Unit *</Label>
                  <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quality */}
                <div>
                  <Label htmlFor="quality">Quality *</Label>
                  <Select value={formData.quality} onValueChange={(value) => handleInputChange('quality', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUALITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-gray-500">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location */}
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., Kampala, Jinja, Mbale"
                    required
                  />
                </div>

                {/* Source */}
                <div>
                  <Label htmlFor="source">Source *</Label>
                  <Select value={formData.source} onValueChange={(value) => handleInputChange('source', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-gray-500">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Effective Date */}
                <div>
                  <Label htmlFor="effectiveDate">Effective Date *</Label>
                  <Input
                    id="effectiveDate"
                    name="effectiveDate"
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
                    required
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                  <Input
                    id="expiryDate"
                    name="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  />
                </div>
              </div>

              {/* Status Warning */}
              {price.status === 'APPROVED' && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This price is currently approved and visible to users. Editing it will change the status back to pending for review by administrators.
                  </AlertDescription>
                </Alert>
              )}
              
              {price.status === 'PENDING' && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This price is currently pending review. Any changes you make will update the submission and keep it in pending status for review.
                  </AlertDescription>
                </Alert>
              )}
              
              {price.status === 'REJECTED' && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This price was previously rejected. You can make changes and resubmit it for review. The status will be set to pending.
                  </AlertDescription>
                </Alert>
              )}
              
              {price.status === 'EXPIRED' && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This price has expired. You can update the details and resubmit it for review. The status will be set to pending.
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/market-prices')}
                >
                  Cancel
                </Button>
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {price.status === 'APPROVED' ? 'Update & Resubmit for Review' : 
                       price.status === 'REJECTED' ? 'Update & Resubmit for Review' :
                       price.status === 'EXPIRED' ? 'Update & Resubmit for Review' : 
                       price.status === 'PENDING' ? 'Update Price' : 'Update Price'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
