import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        location: true,
        avatar: true,
        bio: true,
        dateOfBirth: true,
        gender: true,
        preferredLanguage: true,
        timezone: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        marketingEmails: true,
        twoFactorEnabled: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        billingAddress: true,
        taxId: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ profile: user })
  } catch (error) {
    console.error('Error fetching profile:', error)
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
    const {
      name,
      phone,
      location,
      avatar,
      bio,
      dateOfBirth,
      gender,
      preferredLanguage,
      timezone,
      emailNotifications,
      smsNotifications,
      pushNotifications,
      marketingEmails,
      twoFactorEnabled,
      subscriptionPlan,
      subscriptionStatus,
      subscriptionEndsAt,
      billingAddress,
      taxId
    } = body

    // Validate required fields
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
    }

    if (phone !== undefined && phone && !/^\+?[\d\s\-\(\)]+$/.test(phone)) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 })
    }

    if (dateOfBirth !== undefined && dateOfBirth) {
      const date = new Date(dateOfBirth)
      if (isNaN(date.getTime())) {
        return NextResponse.json({ error: "Invalid date format" }, { status: 400 })
      }
    }

    if (subscriptionEndsAt !== undefined && subscriptionEndsAt) {
      const date = new Date(subscriptionEndsAt)
      if (isNaN(date.getTime())) {
        return NextResponse.json({ error: "Invalid subscription end date format" }, { status: 400 })
      }
    }

    const updateData: any = {}
    
    // Only update fields that are provided
    if (name !== undefined) updateData.name = name.trim()
    if (phone !== undefined) updateData.phone = phone || null
    if (location !== undefined) updateData.location = location || null
    if (avatar !== undefined) updateData.avatar = avatar || null
    if (bio !== undefined) updateData.bio = bio || null
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null
    if (gender !== undefined) updateData.gender = gender || null
    if (preferredLanguage !== undefined) updateData.preferredLanguage = preferredLanguage
    if (timezone !== undefined) updateData.timezone = timezone
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications
    if (smsNotifications !== undefined) updateData.smsNotifications = smsNotifications
    if (pushNotifications !== undefined) updateData.pushNotifications = pushNotifications
    if (marketingEmails !== undefined) updateData.marketingEmails = marketingEmails
    if (twoFactorEnabled !== undefined) updateData.twoFactorEnabled = twoFactorEnabled
    if (subscriptionPlan !== undefined) updateData.subscriptionPlan = subscriptionPlan
    if (subscriptionStatus !== undefined) updateData.subscriptionStatus = subscriptionStatus
    if (subscriptionEndsAt !== undefined) updateData.subscriptionEndsAt = subscriptionEndsAt ? new Date(subscriptionEndsAt) : null
    if (billingAddress !== undefined) updateData.billingAddress = billingAddress || null
    if (taxId !== undefined) updateData.taxId = taxId || null

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        location: true,
        avatar: true,
        bio: true,
        dateOfBirth: true,
        gender: true,
        preferredLanguage: true,
        timezone: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        marketingEmails: true,
        twoFactorEnabled: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        billingAddress: true,
        taxId: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({ 
      message: "Profile updated successfully", 
      profile: updatedUser 
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 