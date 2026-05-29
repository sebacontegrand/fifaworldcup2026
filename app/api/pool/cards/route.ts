import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let balance = await prisma.chipBalance.findUnique({ where: { userId: session.user.id } })
  if (!balance) {
    balance = await prisma.chipBalance.create({ data: { userId: session.user.id } })
  }

  const cards = await prisma.userCard.findMany({
    where: { userId: session.user.id, quantity: { gt: 0 } },
    include: { card: true },
  })

  const available = cards.map(uc => ({
    id: uc.cardTemplateId,
    name: uc.card.name,
    description: uc.card.description,
    effect: uc.card.effect,
    rarity: uc.card.rarity,
    quantity: uc.quantity,
    cooldownHours: uc.card.cooldownHours,
    multiplier: uc.card.multiplier,
    lastUsedAt: uc.lastUsedAt,
  }))

  // Give new users 3 random common cards if they have none
  if (available.length === 0) {
    const commonCards = await prisma.cardTemplate.findMany({ where: { rarity: "common" } })
    if (commonCards.length > 0) {
      for (const card of commonCards) {
        const existing = await prisma.userCard.findUnique({
          where: { userId_cardTemplateId: { userId: session.user.id, cardTemplateId: card.id } },
        })
        if (existing) {
          await prisma.userCard.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + (card.name === "Double Down" ? 2 : 1) },
          })
        } else {
          await prisma.userCard.create({
            data: {
              userId: session.user.id,
              cardTemplateId: card.id,
              quantity: card.name === "Double Down" ? 2 : 1,
            },
          })
        }
      }
    }
    // Re-fetch
    const refreshed = await prisma.userCard.findMany({
      where: { userId: session.user.id, quantity: { gt: 0 } },
      include: { card: true },
    })
    return NextResponse.json(refreshed.map(uc => ({
      id: uc.cardTemplateId,
      name: uc.card.name,
      description: uc.card.description,
      effect: uc.card.effect,
      rarity: uc.card.rarity,
      quantity: uc.quantity,
      cooldownHours: uc.card.cooldownHours,
      multiplier: uc.card.multiplier,
      lastUsedAt: uc.lastUsedAt,
    })))
  }

  return NextResponse.json(available)
}
