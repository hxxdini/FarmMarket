"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { 
  Plus, 
  Bell, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  MapPin, 
  Package, 
  Settings,
  Edit,
  Trash2,
  Eye,
  Clock,
  Zap
} from "lucide-react"

interface PriceAlert {
  id: string
  cropType: string
  location: string
  quality: 'PREMIUM' | 'STANDARD' | 'ECONOMY' | null
  alertType: 'PRICE_INCREASE' | 'PRICE_DECREASE' | 'PRICE_VOLATILITY' | 'REGIONAL_DIFFERENCE' | 'QUALITY_OPPORTUNITY' | 'SEASONAL_TREND'
  frequency: 'IMMEDIATE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
  threshold: number
  isActive: boolean
  lastTriggered?: string
  createdAt: string
  updatedAt: string
}

interface AlertFormData {
  cropType: string
  location: string
  quality: 'PREMIUM' | 'STANDARD' | 'ECONOMY' | null
  alertType: 'PRICE_INCREASE' | 'PRICE_DECREASE' | 'PRICE_VOLATILITY' | 'REGIONAL_DIFFERENCE' | 'QUALITY_OPPORTUNITY' | 'SEASONAL_TREND'
  frequency: 'IMMEDIATE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
  threshold: string
}

const ALERT_TYPE_OPTIONS = [
  { value: 'PRICE_INCREASE', label: 'Price Increase', description: 'Get notified when prices go up', icon: TrendingUp },
  { value: 'PRICE_DECREASE', label: 'Price Decrease', description: 'Get notified when prices go down', icon: TrendingDown },
  { value: 'PRICE_VOLATILITY', label: 'Price Volatility', description: 'Get notified of significant price swings', icon: AlertTriangle },
  { value: 'REGIONAL_DIFFERENCE', label: 'Regional Difference', description: 'Get notified of price differences between regions', icon: MapPin },
  { value: 'QUALITY_OPPORTUNITY', label: 'Quality Opportunity', description: 'Get notified of quality-based pricing opportunities', icon: Package },
  { value: 'SEASONAL_TREND', label: 'Seasonal Trend', description: 'Get notified of seasonal price patterns', icon: Clock }
]

const FREQUENCY_OPTIONS = [
  { value: 'IMMEDIATE', label: 'Immediate', description: 'Get notified instantly' },
  { value: 'DAILY', label: 'Daily', description: 'Get notified once per day' },
  { value: 'WEEKLY', label: 'Weekly', description: 'Get notified once per week' },
  { value: 'MONTHLY', label: 'Monthly', description: 'Get notified once per month' }
]

const QUALITY_OPTIONS = [
  { value: null, label: 'Any Quality', description: 'Monitor all quality grades' },
  { value: 'PREMIUM', label: 'Premium', description: 'Monitor premium quality only' },
  { value: 'STANDARD', label: 'Standard', description: 'Monitor standard quality only' },
  { value: 'ECONOMY', label: 'Economy', description: 'Monitor economy quality only' }
]

export default function PriceAlertsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingAlert, setEditingAlert] = useState<PriceAlert | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  
  const [formData, setFormData] = useState<AlertFormData>({
    cropType: '',
    location: '',
    quality: null,
    alertType: 'PRICE_INCREASE',
    frequency: 'DAILY',
    threshold: '10'
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      fetchAlerts()
    }
  }, [status, router])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/price-alerts')
      
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.data)
      } else {
        const error = await response.json()
        console.error('Failed to fetch alerts:', error)
        toast.error('Failed to fetch price alerts')
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
      toast.error('Failed to fetch price alerts')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof AlertFormData, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      cropType: '',
      location: '',
      quality: null,
      alertType: 'PRICE_INCREASE',
      frequency: 'DAILY',
      threshold: '10'
    })
    setEditingAlert(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (alert: PriceAlert) => {
    setFormData({
      cropType: alert.cropType,
      location: alert.location,
      quality: alert.quality,
      alertType: alert.alertType,
      frequency: alert.frequency,
      threshold: alert.threshold.toString()
    })
    setEditingAlert(alert)
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.cropType || !formData.location || !formData.threshold) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setSubmitting(true)
      
      const url = editingAlert 
        ? `/api/price-alerts/${editingAlert.id}`
        : '/api/price-alerts'
      
      const method = editingAlert ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          threshold: parseFloat(formData.threshold)
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message)
        
        setDialogOpen(false)
        resetForm()
        fetchAlerts()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save price alert')
      }
    } catch (error) {
      console.error('Submission error:', error)
      toast.error("Failed to save price alert. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this price alert?')) {
      return
    }

    try {
      const response = await fetch(`/api/price-alerts/${alertId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Price alert deleted successfully')
        fetchAlerts()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete price alert')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error("Failed to delete price alert. Please try again.")
    }
  }

  const toggleAlertStatus = async (alertId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/price-alerts/${alertId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus
        }),
      })

      if (response.ok) {
        toast.success(`Alert ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
        fetchAlerts()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update alert status')
      }
    } catch (error) {
      console.error('Toggle error:', error)
      toast.error("Failed to update alert status. Please try again.")
    }
  }

  const getAlertTypeIcon = (alertType: string) => {
    const option = ALERT_TYPE_OPTIONS.find(opt => opt.value === alertType)
    return option ? option.icon : AlertTriangle
  }

  const getAlertTypeColor = (alertType: string) => {
    switch (alertType) {
      case 'PRICE_INCREASE': return 'bg-green-100 text-green-800 border-green-200'
      case 'PRICE_DECREASE': return 'bg-red-100 text-red-800 border-red-200'
      case 'PRICE_VOLATILITY': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'REGIONAL_DIFFERENCE': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'QUALITY_OPPORTUNITY': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'SEASONAL_TREND': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'IMMEDIATE': return <Zap className="h-4 w-4" />
      case 'DAILY': return <Clock className="h-4 w-4" />
      case 'WEEKLY': return <Clock className="h-4 w-4" />
      case 'MONTHLY': return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Price Alerts</h1>
            <p className="text-lg text-gray-600">
              Set up alerts to monitor market price changes for your crops
            </p>
          </div>
          
          <Button onClick={openCreateDialog} className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Create Alert
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Alerts</p>
                  <p className="text-2xl font-bold">{alerts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Active Alerts</p>
                  <p className="text-2xl font-bold">
                    {alerts.filter(a => a.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Price Increases</p>
                  <p className="text-2xl font-bold">
                    {alerts.filter(a => a.alertType === 'PRICE_INCREASE').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Price Decreases</p>
                  <p className="text-2xl font-bold">
                    {alerts.filter(a => a.alertType === 'PRICE_DECREASE').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading price alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <Card className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No price alerts set up</h3>
            <p className="text-gray-500 mb-4">
              Create your first price alert to start monitoring market changes
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Alert
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alerts.map((alert) => {
              const AlertTypeIcon = getAlertTypeIcon(alert.alertType)
              return (
                <Card key={alert.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{alert.cropType}</CardTitle>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getAlertTypeColor(alert.alertType)}>
                            <AlertTypeIcon className="h-3 w-3 mr-1" />
                            {alert.alertType.replace('_', ' ')}
                          </Badge>
                          <Badge variant={alert.isActive ? 'default' : 'secondary'}>
                            {alert.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={alert.isActive}
                          onCheckedChange={() => toggleAlertStatus(alert.id, alert.isActive)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Location and Quality */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{alert.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span>Quality: {alert.quality || 'Any'}</span>
                      </div>
                    </div>

                    {/* Threshold and Frequency */}
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-900 mb-1">Alert Threshold</div>
                      <div className="text-lg font-semibold text-blue-700">
                        {alert.threshold}%
                      </div>
                      <div className="text-sm text-blue-600 flex items-center space-x-1">
                        {getFrequencyIcon(alert.frequency)}
                        <span>{alert.frequency.toLowerCase()} updates</span>
                      </div>
                    </div>

                    {/* Last Triggered */}
                    {alert.lastTriggered && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-sm text-green-900 mb-1">Last Triggered</div>
                        <div className="text-sm text-green-700">
                          {new Date(alert.lastTriggered).toLocaleDateString()}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(alert)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(alert.id)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAlert ? 'Edit Price Alert' : 'Create Price Alert'}
            </DialogTitle>
            <DialogDescription>
              Set up monitoring for price changes in your preferred crops and locations
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="quality">Quality Grade</Label>
              <Select value={formData.quality || ''} onValueChange={(value) => handleInputChange('quality', value === '' ? null : value as any)}>
                <SelectTrigger id="quality" name="quality">
                  <SelectValue placeholder="Select quality grade" />
                </SelectTrigger>
                <SelectContent>
                  {QUALITY_OPTIONS.map((quality) => (
                    <SelectItem key={quality.value || 'any'} value={quality.value || ''}>
                      <div>
                        <div className="font-medium">{quality.label}</div>
                        <div className="text-sm text-gray-500">{quality.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="alertType">Alert Type *</Label>
              <Select value={formData.alertType} onValueChange={(value: any) => handleInputChange('alertType', value)}>
                <SelectTrigger id="alertType" name="alertType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALERT_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <type.icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-gray-500">{type.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="frequency">Update Frequency *</Label>
              <Select value={formData.frequency} onValueChange={(value: any) => handleInputChange('frequency', value)}>
                <SelectTrigger id="frequency" name="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      <div>
                        <div className="font-medium">{freq.label}</div>
                        <div className="text-sm text-gray-500">{freq.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="threshold">Threshold (%) *</Label>
              <Input
                id="threshold"
                name="threshold"
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                value={formData.threshold}
                onChange={(e) => handleInputChange('threshold', e.target.value)}
                placeholder="10"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Get notified when prices change by this percentage or more
              </p>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                ) : (
                  <Bell className="h-4 w-4 mr-2" />
                )}
                {editingAlert ? 'Update Alert' : 'Create Alert'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
