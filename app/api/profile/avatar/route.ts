import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import { writeFile } from "fs/promises"
import path from "path"


export async function POST(req: NextRequest) {
  const session = await getServerSession(req, authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!session?.user?.email || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const formData = await req.formData()
  const file = formData.get("avatar") as File | null
  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
  }
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const avatarsDir = path.join(process.cwd(), "public", "avatars")
  await writeFile(path.join(avatarsDir, `${userId}.jpg`), buffer)
  const avatarUrl = `/avatars/${userId}.jpg`
  await prisma.user.update({ where: { email: session.user.email }, data: { avatar: avatarUrl } })
  return NextResponse.json({ avatarUrl })
} 