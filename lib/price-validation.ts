import { prisma } from "./prisma"

export interface PriceValidationResult {
  isValid: boolean
  confidence: number
  warnings: string[]
  suggestions: PriceSuggestion[]
  regionalAverage?: number
  priceChange?: number
  marketTrend?: 'UP' | 'DOWN' | 'STABLE'
}

export interface PriceSuggestion {
  type: 'PRICE_RANGE' | 'QUALITY_ADJUSTMENT' | 'LOCATION_COMPARISON'
  message: string
  confidence: number
  suggestedValue?: number
}

export interface QualityGradingCriteria {
  cropType: string
  premium: {
    minPrice: number
    maxPrice: number
    characteristics: string[]
  }
  standard: {
    minPrice: number
    maxPrice: number
    characteristics: string[]
  }
  economy: {
    minPrice: number
    maxPrice: number
    characteristics: string[]
  }
}

/**
 * Validate a submitted market price against historical data and regional averages
 */
export async function validateMarketPrice(
  cropType: string,
  pricePerUnit: number,
  quality: 'PREMIUM' | 'STANDARD' | 'ECONOMY',
  location: string,
  unit: string
): Promise<PriceValidationResult> {
  const result: PriceValidationResult = {
    isValid: true,
    confidence: 0.8,
    warnings: [],
    suggestions: []
  }

  try {
    // Get recent prices for the same crop, quality, and location
    const recentPrices = await prisma.marketPrice.findMany({
      where: {
        cropType: { contains: cropType, mode: 'insensitive' },
        quality,
        location: { contains: location, mode: 'insensitive' },
        status: 'APPROVED',
        isVerified: true,
        OR: [
          { expiryDate: null },
          { expiryDate: { gt: new Date() } }
        ]
      },
      orderBy: { effectiveDate: 'desc' },
      take: 10
    })

    if (recentPrices.length === 0) {
      // No existing data - this is normal for new submissions
      result.warnings.push('No recent price data available for comparison. This is normal for new submissions.')
      result.confidence = 0.7
      result.isValid = true
      return result
    }

    // Calculate regional average
    const totalPrice = recentPrices.reduce((sum, price) => sum + price.pricePerUnit, 0)
    const averagePrice = totalPrice / recentPrices.length
    result.regionalAverage = averagePrice

    // Calculate price change from previous period
    if (recentPrices.length >= 2) {
      const currentAvg = recentPrices.slice(0, 3).reduce((sum, price) => sum + price.pricePerUnit, 0) / 3
      const previousAvg = recentPrices.slice(3, 6).reduce((sum, price) => sum + price.pricePerUnit, 0) / 3
      
      if (previousAvg > 0) {
        result.priceChange = ((currentAvg - previousAvg) / previousAvg) * 100
      }
    }

    // Determine market trend
    if (result.priceChange) {
      if (result.priceChange > 5) {
        result.marketTrend = 'UP'
      } else if (result.priceChange < -5) {
        result.marketTrend = 'DOWN'
      } else {
        result.marketTrend = 'STABLE'
      }
    }

    // Validate price against regional average
    const priceDeviation = Math.abs(pricePerUnit - averagePrice) / averagePrice
    
    if (priceDeviation > 0.5) { // 50% deviation
      result.warnings.push(`Price deviates significantly from regional average (${(priceDeviation * 100).toFixed(1)}%)`)
      result.isValid = false
      result.confidence = 0.3
      
      result.suggestions.push({
        type: 'PRICE_RANGE',
        message: `Consider adjusting price to be within ${(averagePrice * 0.8).toFixed(2)} - ${(averagePrice * 1.2).toFixed(2)} ${unit}`,
        confidence: 0.8,
        suggestedValue: averagePrice
      })
    } else if (priceDeviation > 0.2) { // 20% deviation
      result.warnings.push(`Price deviates moderately from regional average (${(priceDeviation * 100).toFixed(1)}%)`)
      result.confidence = 0.6
    }

    // Check for quality-price consistency
    const qualityValidation = validateQualityPriceConsistency(cropType, pricePerUnit, quality, averagePrice)
    if (!qualityValidation.isValid) {
      result.warnings.push(qualityValidation.message)
      result.suggestions.push(...qualityValidation.suggestions)
      result.confidence = Math.min(result.confidence, 0.5)
    }

    // Check for seasonal patterns (non-critical validation)
    try {
      const seasonalValidation = await validateSeasonalPricing(cropType, pricePerUnit, location)
      if (seasonalValidation.warnings.length > 0) {
        result.warnings.push(...seasonalValidation.warnings)
        result.confidence = Math.min(result.confidence, seasonalValidation.confidence)
      }
    } catch (seasonalError) {
      // Seasonal validation is not critical, just log the error
      console.error('Seasonal validation error (non-critical):', seasonalError)
      // Don't add warnings for seasonal validation failures
    }

    return result
  } catch (error) {
    console.error('Error validating market price:', error)
    
    // Provide more specific error information
    if (error instanceof Error) {
      if (error.message.includes('prisma')) {
        console.error('Prisma error details:', error.message)
        // Check if it's a specific Prisma error
        if (error.message.includes('Unknown field')) {
          result.warnings.push('Database schema issue detected. Please contact support.')
        } else if (error.message.includes('connection')) {
          result.warnings.push('Database connection issue. Please try again.')
        } else {
          result.warnings.push(`Database error: ${error.message}`)
        }
      } else if (error.message.includes('timeout')) {
        result.warnings.push('Validation timeout. Please try again.')
      } else {
        result.warnings.push(`Validation error: ${error.message}`)
      }
    } else {
      result.warnings.push('Unable to validate price due to system error')
    }
    
    result.isValid = true // Don't block submission due to validation errors
    result.confidence = 0.3
    return result
  }
}

/**
 * Validate that the price is consistent with the quality grade
 */
function validateQualityPriceConsistency(
  cropType: string,
  pricePerUnit: number,
  quality: 'PREMIUM' | 'STANDARD' | 'ECONOMY',
  regionalAverage: number
): { isValid: boolean; message: string; suggestions: PriceSuggestion[] } {
  const suggestions: PriceSuggestion[] = []
  let isValid = true
  let message = ''

  // Define quality multipliers based on crop type and quality
  const qualityMultipliers = {
    PREMIUM: 1.3,    // 30% premium
    STANDARD: 1.0,   // Standard price
    ECONOMY: 0.7     // 30% discount
  }

  const expectedPrice = regionalAverage * qualityMultipliers[quality]
  const deviation = Math.abs(pricePerUnit - expectedPrice) / expectedPrice

  if (deviation > 0.3) { // 30% deviation from expected quality price
    isValid = false
    message = `Price is not consistent with ${quality.toLowerCase()} quality grade`
    
    suggestions.push({
      type: 'QUALITY_ADJUSTMENT',
      message: `For ${quality.toLowerCase()} quality, consider pricing around ${expectedPrice.toFixed(2)}`,
      confidence: 0.9,
      suggestedValue: expectedPrice
    })
  }

  return { isValid, message, suggestions }
}

/**
 * Validate pricing against seasonal patterns
 */
async function validateSeasonalPricing(
  cropType: string,
  pricePerUnit: number,
  location: string
): Promise<{ warnings: string[]; confidence: number }> {
  const warnings: string[] = []
  let confidence = 0.8

  try {
    // Get historical prices for the same month over the past year
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    const seasonalPrices = await prisma.marketPrice.findMany({
      where: {
        cropType: { contains: cropType, mode: 'insensitive' },
        location: { contains: location, mode: 'insensitive' },
        status: 'APPROVED',
        isVerified: true,
        effectiveDate: {
          gte: new Date(currentYear - 1, currentMonth, 1),
          lt: new Date(currentYear, currentMonth + 1, 1)
        }
      },
      orderBy: { effectiveDate: 'desc' }
    })

    if (seasonalPrices.length >= 3) {
      const seasonalAverage = seasonalPrices.reduce((sum, price) => sum + price.pricePerUnit, 0) / seasonalPrices.length
      const seasonalDeviation = Math.abs(pricePerUnit - seasonalAverage) / seasonalAverage

      if (seasonalDeviation > 0.4) { // 40% deviation from seasonal average
        warnings.push(`Price deviates significantly from seasonal average for ${cropType} in ${location}`)
        confidence = 0.5
      }
    }
  } catch (error) {
    console.error('Error validating seasonal pricing:', error)
    confidence = 0.6
    // Don't add warnings for seasonal validation errors as they're not critical
  }

  return { warnings, confidence }
}

/**
 * Calculate verification score based on various factors
 */
export function calculateVerificationScore(
  validationResult: PriceValidationResult,
  userReputation: number = 0.5
): number {
  let score = 0.5 // Base score

  // Price validation confidence
  score += validationResult.confidence * 0.3

  // User reputation (if available)
  score += userReputation * 0.2

  // Warnings reduce score
  score -= validationResult.warnings.length * 0.05

  // Ensure score is between 0 and 1
  return Math.max(0, Math.min(1, score))
}

/**
 * Get quality grading criteria for different crop types
 */
export function getQualityGradingCriteria(cropType: string): QualityGradingCriteria {
  // This could be expanded with more sophisticated criteria
  const baseCriteria: QualityGradingCriteria = {
    cropType,
    premium: {
      minPrice: 0,
      maxPrice: 0,
      characteristics: ['High quality', 'Certified organic', 'Premium grade']
    },
    standard: {
      minPrice: 0,
      maxPrice: 0,
      characteristics: ['Standard quality', 'Good condition', 'Regular grade']
    },
    economy: {
      minPrice: 0,
      maxPrice: 0,
      characteristics: ['Economy grade', 'Basic quality', 'Value option']
    }
  }

  return baseCriteria
}
