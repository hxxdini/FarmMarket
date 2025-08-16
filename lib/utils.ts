import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Redis-related code removed. Only client-safe utilities remain.

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
