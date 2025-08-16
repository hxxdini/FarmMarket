"use client"

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  readonly?: boolean
  onRatingChange?: (rating: number) => void
  showValue?: boolean
  className?: string
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  readonly = false,
  onRatingChange,
  showValue = false,
  className
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)
  const [localRating, setLocalRating] = useState(rating)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const handleStarClick = (starValue: number) => {
    if (readonly) return
    
    const newRating = starValue === localRating ? 0 : starValue
    setLocalRating(newRating)
    onRatingChange?.(newRating)
  }

  const handleStarHover = (starValue: number) => {
    if (readonly) return
    setHoverRating(starValue)
  }

  const handleMouseLeave = () => {
    if (readonly) return
    setHoverRating(0)
  }

  const displayRating = hoverRating || localRating

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div 
        className="flex items-center"
        onMouseLeave={handleMouseLeave}
      >
        {Array.from({ length: maxRating }, (_, index) => {
          const starValue = index + 1
          const isFilled = starValue <= displayRating
          const isHalf = starValue === Math.ceil(displayRating) && displayRating % 1 !== 0

          return (
            <button
              key={starValue}
              type="button"
              className={cn(
                "transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded",
                !readonly && "cursor-pointer hover:scale-110"
              )}
              onClick={() => handleStarClick(starValue)}
              onMouseEnter={() => handleStarHover(starValue)}
              disabled={readonly}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  isFilled 
                    ? "fill-yellow-400 text-yellow-400" 
                    : "fill-gray-200 text-gray-200"
                )}
              />
            </button>
          )
        })}
      </div>
      
      {showValue && (
        <span className="text-sm font-medium text-gray-700">
          {displayRating.toFixed(1)} / {maxRating}
        </span>
      )}
    </div>
  )
}

// Display-only star rating component
export function StarRatingDisplay({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = false,
  className
}: Omit<StarRatingProps, 'readonly' | 'onRatingChange'>) {
  return (
    <StarRating
      rating={rating}
      maxRating={maxRating}
      size={size}
      readonly={true}
      showValue={showValue}
      className={className}
    />
  )
}

