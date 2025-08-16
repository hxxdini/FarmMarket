import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import bcrypt from "bcryptjs"


export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { currentPassword, newPassword } = await req.json()
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user || !user.password) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }
  const isValid = await bcrypt.compare(currentPassword, user.password)
  if (!isValid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
  }
  const hashed = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { email: session.user.email }, data: { password: hashed } })
  return NextResponse.json({ message: "Password updated" })
} 