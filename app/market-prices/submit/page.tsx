"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { ArrowLeft, Upload, CheckCircle, AlertTriangle, Info } from "lucide-react"
import { validateMarketPrice, PriceValidationResult } from "@/lib/price-validation"

interface PriceSubmissionForm {
  cropType: string
  pricePerUnit: string
  unit: string
  quality: 'PREMIUM' | 'STANDARD' | 'ECONOMY'
  location: string
  source: 'FARMER_SUBMISSION' | 'EXTENSION_OFFICER' | 'MARKET_SURVEY'
  effectiveDate: string
  expiryDate: string
  notes: string
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

export default function PriceSubmissionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [validationResult, setValidationResult] = useState<PriceValidationResult | null>(null)
  const [showValidation, setShowValidation] = useState(false)
  
  const [formData, setFormData] = useState<PriceSubmissionForm>({
    cropType: '',
    pricePerUnit: '',
    unit: 'kg',
    quality: 'STANDARD',
    location: '',
    source: 'FARMER_SUBMISSION',
    effectiveDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    notes: ''
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [status, router])

  const handleInputChange = (field: keyof PriceSubmissionForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear validation when user makes changes
    if (validationResult) {
      setValidationResult(null)
      setShowValidation(false)
    }
  }

  const validatePrice = async () => {
    if (!formData.cropType || !formData.pricePerUnit || !formData.location) {
      toast.error("Please fill in all required fields before validation")
      return
    }

    try {
      setLoading(true)
      const result = await validateMarketPrice(
        formData.cropType,
        parseFloat(formData.pricePerUnit),
        formData.quality,
        formData.location,
        formData.unit
      )
      
      setValidationResult(result)
      setShowValidation(true)
      
      if (result.isValid) {
        toast.success("Price validation passed! You can submit this price.")
      } else {
        toast.warning("Price validation failed. Please review the warnings.")
      }
    } catch (error) {
      console.error('Validation error:', error)
      toast.error("Failed to validate price. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validationResult || !validationResult.isValid) {
      toast.error("Please validate your price first and ensure it passes validation")
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/market-prices', {
        method: 'POST',
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
        toast.success("Price submitted successfully! It will be reviewed by our team.")
        
        // Reset form
        setFormData({
          cropType: '',
          pricePerUnit: '',
          unit: 'kg',
          quality: 'STANDARD',
          location: '',
          source: 'FARMER_SUBMISSION',
          effectiveDate: new Date().toISOString().split('T')[0],
          expiryDate: '',
          notes: ''
        })
        setValidationResult(null)
        setShowValidation(false)
        
        // Redirect to market prices page
        router.push('/market-prices')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to submit price')
      }
    } catch (error) {
      console.error('Submission error:', error)
      toast.error("Failed to submit price. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Market Price</h1>
        <p className="text-lg text-gray-600">
          Help other farmers by sharing current market prices for your crops
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Price Information
              </CardTitle>
              <CardDescription>
                Fill in the details about your crop and pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Crop and Price Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cropType">Crop Type *</Label>
                    <Input
                      id="cropType"
                      name="cropType"
                      value={formData.cropType}
                      onChange={(e) => handleInputChange('cropType', e.target.value)}
                      placeholder="e.g., Maize, Beans, Rice"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="pricePerUnit">Price Per Unit *</Label>
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
                </div>

                {/* Unit and Quality Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="unit">Unit *</Label>
                    <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                      <SelectTrigger id="unit" name="unit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_OPTIONS.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="quality">Quality Grade *</Label>
                    <Select value={formData.quality} onValueChange={(value: any) => handleInputChange('quality', value)}>
                      <SelectTrigger id="quality" name="quality">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {QUALITY_OPTIONS.map((quality) => (
                          <SelectItem key={quality.value} value={quality.value}>
                            <div>
                              <div className="font-medium">{quality.label}</div>
                              <div className="text-sm text-gray-500">{quality.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Location and Source Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  
                  <div>
                    <Label htmlFor="source">Data Source</Label>
                    <Select value={formData.source} onValueChange={(value: any) => handleInputChange('source', value)}>
                      <SelectTrigger id="source" name="source">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SOURCE_OPTIONS.map((source) => (
                          <SelectItem key={source.value} value={source.value}>
                            <div>
                              <div className="font-medium">{source.label}</div>
                              <div className="text-sm text-gray-500">{source.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dates Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                    <Input
                      id="expiryDate"
                      name="expiryDate"
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                      min={formData.effectiveDate}
                    />
                  </div>
                </div>

                {/* Notes Section */}
                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any additional information about the price, quality, or market conditions..."
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={validatePrice}
                    disabled={loading || !formData.cropType || !formData.pricePerUnit || !formData.location}
                    className="flex-1"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Validate Price
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={loading || !validationResult || !validationResult.isValid}
                    className="flex-1"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Submit Price
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Validation Results Sidebar */}
        <div className="lg:col-span-1">
          {showValidation && validationResult && (
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  {validationResult.isValid ? (
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                  )}
                  Validation Results
                </CardTitle>
                <CardDescription>
                  {validationResult.isValid ? 'Price validation passed!' : 'Please review the warnings below'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Confidence Score */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Confidence Score:</span>
                  <Badge variant={validationResult.confidence > 0.7 ? 'default' : 'secondary'}>
                    {(validationResult.confidence * 100).toFixed(0)}%
                  </Badge>
                </div>

                {/* Regional Average */}
                {validationResult.regionalAverage && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-900">Regional Average</div>
                    <div className="text-lg font-bold text-blue-700">
                      {validationResult.regionalAverage.toFixed(2)} {formData.unit}
                    </div>
                  </div>
                )}

                {/* Market Trend */}
                {validationResult.marketTrend && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-sm font-medium text-green-900">Market Trend</div>
                    <Badge 
                      variant={
                        validationResult.marketTrend === 'UP' ? 'default' : 
                        validationResult.marketTrend === 'DOWN' ? 'destructive' : 'secondary'
                      }
                    >
                      {validationResult.marketTrend}
                    </Badge>
                  </div>
                )}

                {/* Warnings */}
                {validationResult.warnings.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-red-900 mb-2">Warnings:</div>
                    <div className="space-y-2">
                      {validationResult.warnings.map((warning, index) => (
                        <Alert key={index} variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{warning}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {validationResult.suggestions.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-blue-900 mb-2">Suggestions:</div>
                    <div className="space-y-2">
                      {validationResult.suggestions.map((suggestion, index) => (
                        <Alert key={index}>
                          <Info className="h-4 w-4" />
                          <AlertDescription>{suggestion.message}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Help Information */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Tips for Accurate Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Use current market rates from your area</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Consider quality differences when setting prices</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Include any special conditions or certifications</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Prices are reviewed by our team for accuracy</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
