import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailNotifications: true, email: true },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json({ emailNotifications: user.emailNotifications, email: user.email })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { emailNotifications } = body

  if (typeof emailNotifications !== "boolean") {
    return NextResponse.json({ error: "emailNotifications must be a boolean" }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { emailNotifications },
  })

  return NextResponse.json({ ok: true, emailNotifications })
}
