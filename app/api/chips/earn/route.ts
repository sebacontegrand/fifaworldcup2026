import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

async function ensureUser(session: { user: { id: string; name?: string | null; email?: string | null; image?: string | null } }) {
  await prisma.user.upsert({
    where: { id: session.user.id },
    create: {
      id: session.user.id,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      image: session.user.image ?? null,
    },
    update: {},
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { amount, source } = body

  if (!amount || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
  }

  if (!source || !["connection", "live_guess", "game"].includes(source)) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 })
  }

  await ensureUser(session)

  const chipBalance = await prisma.chipBalance.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, balance: amount, lifetimeEarnings: amount },
    update: {
      balance: { increment: amount },
      lifetimeEarnings: { increment: amount },
    },
  })

  return NextResponse.json({ balance: chipBalance.balance, lifetimeEarnings: chipBalance.lifetimeEarnings, earned: amount })
}
