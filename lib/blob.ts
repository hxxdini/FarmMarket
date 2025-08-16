import { put, del, list } from '@vercel/blob';
import { NextRequest } from 'next/server';

export interface UploadResult {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
}

export interface DeleteResult {
  success: boolean;
  message: string;
}

export class BlobService {
  private static instance: BlobService;

  private constructor() {}

  public static getInstance(): BlobService {
    if (!BlobService.instance) {
      BlobService.instance = new BlobService();
    }
    return BlobService.instance;
  }

  /**
   * Upload an image file to Vercel Blob
   */
  async uploadImage(
    file: File,
    folder: 'products' | 'profiles' | 'temp',
    filename?: string
  ): Promise<UploadResult> {
    try {
      const blob = await put(
        `${folder}/${filename || `${Date.now()}-${file.name}`}`,
        file,
        {
          access: 'public',
          addRandomSuffix: true,
        }
      );

      return {
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType,
        size: blob.size,
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  }

  /**
   * Delete an image from Vercel Blob
   */
  async deleteImage(url: string): Promise<DeleteResult> {
    try {
      await del(url);
      return {
        success: true,
        message: 'Image deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting image:', error);
      return {
        success: false,
        message: 'Failed to delete image',
      };
    }
  }

  /**
   * List images in a specific folder
   */
  async listImages(folder: string, limit?: number) {
    try {
      const { blobs } = await list({
        prefix: folder,
        limit: limit || 100,
      });
      return blobs;
    } catch (error) {
      console.error('Error listing images:', error);
      throw new Error('Failed to list images');
    }
  }

  /**
   * Generate optimized image URL with Vercel's image optimization
   */
  getOptimizedImageUrl(url: string, width: number, height: number, quality: number = 80): string {
    // Vercel automatically optimizes images when accessed through their CDN
    // You can add query parameters for further optimization
    return `${url}?w=${width}&h=${height}&q=${quality}&fit=crop`;
  }

  /**
   * Generate thumbnail URL
   */
  getThumbnailUrl(url: string): string {
    return this.getOptimizedImageUrl(url, 300, 300, 70);
  }

  /**
   * Generate medium size URL
   */
  getMediumUrl(url: string): string {
    return this.getOptimizedImageUrl(url, 600, 600, 80);
  }

  /**
   * Generate large size URL
   */
  getLargeUrl(url: string): string {
    return this.getOptimizedImageUrl(url, 1200, 1200, 90);
  }
}

export const blobService = BlobService.getInstance();
