import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "sebacontegrand@gmail.com"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || session.user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { userId, adjustment } = body

  if (!userId || typeof adjustment !== "number") {
    return NextResponse.json({ error: "userId and adjustment (number) required" }, { status: 400 })
  }

  await prisma.chipBalance.upsert({
    where: { userId },
    create: { userId, rankingAdjustment: adjustment },
    update: { rankingAdjustment: adjustment },
  })

  return NextResponse.json({ success: true, userId, adjustment })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || session.user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      chipBalance: { select: { rankingAdjustment: true } },
    },
  })

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      adjustment: u.chipBalance?.rankingAdjustment ?? 0,
    }))
  )
}
