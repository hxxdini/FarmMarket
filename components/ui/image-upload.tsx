"use client"

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { X, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ImageFile {
  id: string
  file: File
  preview: string
  url?: string
  uploading?: boolean
  uploadProgress?: number
}

interface ImageUploadProps {
  onImagesChange: (images: ImageFile[]) => void
  maxImages?: number
  maxSize?: number // in MB
  acceptedTypes?: string[]
  folder: 'products' | 'profiles' | 'temp'
  className?: string
  showPreview?: boolean
  currentImages?: Array<{ id: string; url: string; file?: File | null; preview: string }>
}

export function ImageUpload({
  onImagesChange,
  maxImages = 5,
  maxSize = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  folder,
  className = '',
  showPreview = true,
  currentImages = []
}: ImageUploadProps) {
  const [images, setImages] = useState<ImageFile[]>([])
  const [overallProgress, setOverallProgress] = useState(0)

  // Initialize with current images if provided
  React.useEffect(() => {
    if (currentImages.length > 0) {
      const currentImageFiles: ImageFile[] = currentImages.map(img => ({
        id: img.id,
        file: img.file || new File([], 'current'),
        preview: img.preview,
        url: img.url,
        uploading: false,
        uploadProgress: 100
      }))
      setImages(currentImageFiles)
      // Don't call onImagesChange during initialization to avoid infinite loops
    }
  }, [currentImages]) // Remove onImagesChange dependency

  const uploadImage = async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)
    formData.append('filename', file.name)

    // Simulate upload progress (since we can't get real progress from fetch)
    const progressInterval = setInterval(() => {
      onProgress?.(Math.random() * 90 + 10) // Simulate 10-100% progress
    }, 200)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      onProgress?.(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      return result.image.url
    } finally {
      clearInterval(progressInterval)
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (images.length + acceptedFiles.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images`)
      return
    }

    // Show upload started toast
    toast.info(`Starting upload of ${acceptedFiles.length} image${acceptedFiles.length > 1 ? 's' : ''}...`)

    const newImages: ImageFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      uploading: true,
      uploadProgress: 0
    }))

    setImages(prev => [...prev, ...newImages])
    setOverallProgress(0)
    
    // Upload each image
    for (let i = 0; i < newImages.length; i++) {
      try {
        const url = await uploadImage(newImages[i].file, (progress) => {
          setImages(prev => prev.map(img => 
            img.id === newImages[i].id 
              ? { ...img, uploadProgress: progress }
              : img
          ))
          setOverallProgress((i + progress / 100) / newImages.length * 100)
        })
        
        setImages(prev => prev.map(img => 
          img.id === newImages[i].id 
            ? { ...img, url, uploading: false, uploadProgress: 100 }
            : img
        ))
        
        toast.success(`Image ${i + 1} uploaded successfully!`)
      } catch (error) {
        console.error('Upload error:', error)
        toast.error(`Failed to upload image ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        // Remove failed upload
        setImages(prev => prev.filter(img => img.id !== newImages[i].id))
      }
    }

    setOverallProgress(100)
    
            // Update parent component with final images - call onImagesChange directly here
        setImages(prevImages => {
          const finalImages = prevImages.filter(img => img.url && !img.uploading)
          // Use setTimeout to avoid calling setState during render
          setTimeout(() => onImagesChange(finalImages), 0)
          return prevImages
        })
  }, [maxImages, onImagesChange, folder])

  // Remove this useEffect entirely - it causes infinite loops
  // We'll call onImagesChange directly after uploads complete

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxSize * 1024 * 1024,
    multiple: true
  })

  const removeImage = async (id: string) => {
    const imageToRemove = images.find(img => img.id === id)
    if (imageToRemove?.url) {
      try {
        // Delete from blob storage
        await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: imageToRemove.url })
        })
        toast.success('Image removed successfully')
      } catch (error) {
        console.error('Error removing image:', error)
        toast.error('Failed to remove image')
      }
    }

    const newImages = images.filter(img => img.id !== id)
    setImages(newImages)
    // Use setTimeout to avoid calling setState during render
    setTimeout(() => onImagesChange(newImages.filter(img => img.url && !img.uploading)), 0)
  }

  const hasUploadingImages = images.some(img => img.uploading)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Upload Progress */}
      {hasUploadingImages && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Uploading images... {Math.round(overallProgress)}%
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : hasUploadingImages
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
            `}
          >
            <input {...getInputProps()} disabled={hasUploadingImages} />
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4 flex items-center justify-center text-4xl">
              {hasUploadingImages ? <Loader2 className="h-8 w-8 animate-spin" /> : '📷'}
            </div>
            {isDragActive ? (
              <p className="text-blue-600 font-medium">Drop the images here...</p>
            ) : hasUploadingImages ? (
              <div>
                <p className="text-gray-600 mb-2">Upload in progress...</p>
                <p className="text-sm text-gray-500">Please wait for current uploads to complete</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Drag & drop images here, or <span className="text-blue-600">click to select</span>
                </p>
                <p className="text-sm text-gray-500">
                  Supports: {acceptedTypes.join(', ')} • Max size: {maxSize}MB • Max images: {maxImages}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Previews */}
      {showPreview && images.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Selected Images ({images.length}/{maxImages})</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={image.id} className="relative group">
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative aspect-square">
                      <img
                        src={image.preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Uploading Overlay */}
                      {image.uploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <div className="text-white text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                            <p className="text-sm">Uploading...</p>
                            <div className="w-20 bg-white bg-opacity-30 rounded-full h-1.5 mt-2">
                              <div 
                                className="bg-white h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${image.uploadProgress || 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Success Overlay */}
                      {image.url && !image.uploading && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                      )}

                      {/* Remove Button */}
                      <button
                        onClick={() => removeImage(image.id)}
                        className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={image.uploading}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Image Info */}
                <div className="mt-2 text-xs text-gray-500">
                  <p className="truncate">{image.file.name}</p>
                  <p>{(image.file.size / 1024 / 1024).toFixed(2)} MB</p>
                  {image.uploading && (
                    <div className="flex items-center space-x-1 text-blue-600">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Uploading {Math.round(image.uploadProgress || 0)}%</span>
                    </div>
                  )}
                  {image.url && !image.uploading && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      <span>Uploaded</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
