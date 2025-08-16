import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { listingId, url, altText, order, isPrimary } = body

    if (!listingId || !url) {
      return NextResponse.json({ error: "Missing required fields: listingId, url" }, { status: 400 })
    }

    // Verify the user owns this listing
    const listing = await prisma.productListing.findFirst({
      where: {
        id: listingId,
        farmer: {
          email: session.user.email
        }
      }
    })

    if (!listing) {
      return NextResponse.json({ error: "Listing not found or access denied" }, { status: 404 })
    }

    // If this is the first image, make it primary
    const existingImages = await prisma.productImage.count({
      where: { listingId }
    })

    const imageData: any = {
      url,
      altText: altText || null,
      order: order !== undefined ? order : existingImages,
      isPrimary: isPrimary || existingImages === 0,
      listingId
    }

    // If this image is primary, unset other primary images
    if (imageData.isPrimary) {
      await prisma.productImage.updateMany({
        where: { listingId, isPrimary: true },
        data: { isPrimary: false }
      })
    }

    const productImage = await prisma.productImage.create({
      data: imageData,
      include: {
        listing: {
          select: {
            id: true,
            cropType: true,
            farmer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      message: "Image added successfully",
      image: productImage
    }, { status: 201 })

  } catch (error) {
    console.error('Error adding product image:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { imageId, altText, order, isPrimary } = body

    if (!imageId) {
      return NextResponse.json({ error: "Missing required field: imageId" }, { status: 400 })
    }

    // Verify the user owns this image's listing
    const image = await prisma.productImage.findFirst({
      where: {
        id: imageId,
        listing: {
          farmer: {
            email: session.user.email
          }
        }
      },
      include: {
        ProductListing: {
          select: {
            id: true
          }
        }
      }
    })

    if (!image) {
      return NextResponse.json({ error: "Image not found or access denied" }, { status: 404 })
    }

    const updateData: any = {}
    
    if (altText !== undefined) updateData.altText = altText
    if (order !== undefined) updateData.order = order
    if (isPrimary !== undefined) updateData.isPrimary = isPrimary

    // If this image is being made primary, unset other primary images
    if (isPrimary) {
      await prisma.productImage.updateMany({
        where: { 
          listingId: image.ProductListing.id, 
          isPrimary: true,
          id: { not: imageId }
        },
        data: { isPrimary: false }
      })
    }

    const updatedImage = await prisma.productImage.update({
      where: { id: imageId },
      data: updateData,
      include: {
        listing: {
          select: {
            id: true,
            cropType: true,
            farmer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      message: "Image updated successfully",
      image: updatedImage
    })

  } catch (error) {
    console.error('Error updating product image:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const imageId = searchParams.get('imageId')

    if (!imageId) {
      return NextResponse.json({ error: "Missing required parameter: imageId" }, { status: 400 })
    }

    // Verify the user owns this image's listing
    const image = await prisma.productImage.findFirst({
      where: {
        id: imageId,
        listing: {
          farmer: {
            email: session.user.email
          }
        }
      },
      include: {
        ProductListing: {
          select: {
            id: true
          }
        }
      }
    })

    if (!image) {
      return NextResponse.json({ error: "Image not found or access denied" }, { status: 404 })
    }

    // Delete the image
    await prisma.productImage.delete({
      where: { id: imageId }
    })

    // If this was the primary image, make the next image primary
    if (image.isPrimary) {
      const nextImage = await prisma.productImage.findFirst({
        where: { 
          listingId: image.ProductListing.id,
          id: { not: imageId }
        },
        orderBy: { order: 'asc' }
      })

      if (nextImage) {
        await prisma.productImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true }
        })
      }
    }

    return NextResponse.json({
      message: "Image deleted successfully"
    })

  } catch (error) {
    console.error('Error deleting product image:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
