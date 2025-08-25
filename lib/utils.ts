import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Redis-related code removed. Only client-safe utilities remain.

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// User permission utilities
export function canPostKnowledgeContent(userRole?: string, expertProfile?: any): boolean {
  // Admins and superadmins can always post
  if (userRole === 'admin' || userRole === 'superadmin') {
    return true
  }
  
  // Verified experts and extension officers can post
  if (expertProfile?.isVerified && 
      (expertProfile.type === 'EXPERT' || expertProfile.type === 'EXTENSION_OFFICER')) {
    return true
  }
  
  return false
}

export function getUserTypeLabel(userRole?: string, expertProfile?: any): string {
  if (userRole === 'admin' || userRole === 'superadmin') {
    return 'Administrator'
  }
  
  if (expertProfile?.isVerified) {
    if (expertProfile.type === 'EXTENSION_OFFICER') {
      return 'Extension Officer'
    }
    if (expertProfile.type === 'EXPERT') {
      return 'Expert'
    }
  }
  
  return 'Farmer'
}
